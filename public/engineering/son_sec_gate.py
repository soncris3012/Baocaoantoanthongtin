#!/usr/bin/env python3
"""
son_sec_gate.py - Automated DevSecOps Security Gate (DAST Headers + DockerCIS Hardening).
Evaluates HTTP response headers, dangerous HTTP methods (TRACE/TRACK), and Docker
container isolation flags, outputting a weighted 0-100 score and CI/CD exit code.
Uses Python 3 standard library only (no third-party dependencies required).
"""

from __future__ import annotations

import argparse
import http.client
import json
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class CheckResult:
    name: str
    category: str
    weight: int
    passed: bool
    observed: str
    remediation: str


@dataclass
class GateReport:
    target: str
    container: str
    score: int
    threshold: int
    verdict: str
    checks: list[CheckResult] = field(default_factory=list)


def check_http_surface(target: str, timeout: float = 4.0) -> list[CheckResult]:
    """Audit live HTTP headers and TRACE method handling against target URL."""
    results: list[CheckResult] = []
    parsed = urllib.parse.urlparse(target)
    headers: dict[str, str] = {}
    status_code = 0

    try:
        req = urllib.request.Request(target, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status_code = resp.status
            headers = {k.lower(): v for k, v in resp.headers.items()}
    except urllib.error.HTTPError as err:
        status_code = err.code
        headers = {k.lower(): v for k, v in err.headers.items()}
    except Exception as exc:
        return [
            CheckResult(
                name="HTTP Reachability",
                category="http",
                weight=45,
                passed=False,
                observed=f"Connection error: {exc}",
                remediation="Ensure target web container is running on localhost.",
            )
        ]

    # 1. Server banner minimization
    server_hdr = headers.get("server", "(hidden)")
    server_clean = (
        server_hdr == "(hidden)"
        or ("/" not in server_hdr and "ubuntu" not in server_hdr.lower())
    )
    results.append(
        CheckResult(
            name="Server Tokens & Signature Hidden",
            category="http",
            weight=10,
            passed=server_clean,
            observed=f"HTTP {status_code} | Server: {server_hdr}",
            remediation="Set ServerTokens Prod and ServerSignature Off in Apache.",
        )
    )

    # 2. X-Frame-Options or CSP frame-ancestors
    xfo = headers.get("x-frame-options", "")
    csp = headers.get("content-security-policy", "")
    clickjack_ok = bool(xfo) or ("frame-ancestors" in csp.lower())
    results.append(
        CheckResult(
            name="Clickjacking Defense (X-Frame-Options / CSP)",
            category="http",
            weight=10,
            passed=clickjack_ok,
            observed=f"XFO={xfo or 'missing'}, CSP={'set' if csp else 'missing'}",
            remediation="Set Header always set X-Frame-Options \"SAMEORIGIN\" and CSP frame-ancestors.",
        )
    )

    # 3. X-Content-Type-Options: nosniff
    xcto = headers.get("x-content-type-options", "")
    results.append(
        CheckResult(
            name="MIME Sniffing Protection (nosniff)",
            category="http",
            weight=8,
            passed=xcto.lower() == "nosniff",
            observed=xcto or "missing",
            remediation="Set Header always set X-Content-Type-Options \"nosniff\".",
        )
    )

    # 4. Strict CSP Header
    csp_ok = "default-src" in csp.lower() and "unsafe-inline" not in csp.lower()
    results.append(
        CheckResult(
            name="Content-Security-Policy Strictness",
            category="http",
            weight=10,
            passed=csp_ok,
            observed=csp if csp else "missing",
            remediation="Enforce CSP default-src 'self' without 'unsafe-inline'.",
        )
    )

    # 5. TRACE Method Check
    trace_disabled = True
    trace_obs = "405 Method Not Allowed"
    try:
        conn_cls = (
            http.client.HTTPSConnection
            if parsed.scheme == "https"
            else http.client.HTTPConnection
        )
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        conn = conn_cls(host, port, timeout=timeout)
        conn.request("TRACE", parsed.path or "/")
        t_resp = conn.getresponse()
        trace_disabled = t_resp.status in (403, 405, 501)
        trace_obs = f"HTTP {t_resp.status} {t_resp.reason}"
        conn.close()
    except Exception as exc:
        trace_obs = f"probe failed ({exc})"
        trace_disabled = False

    results.append(
        CheckResult(
            name="HTTP TRACE Method Disabled (XST Prevention)",
            category="http",
            weight=7,
            passed=trace_disabled,
            observed=trace_obs,
            remediation="Set TraceEnable off in Apache global config.",
        )
    )

    return results


def check_docker_hardening(container: str) -> list[CheckResult]:
    """Inspect Docker HostConfig security posture against CIS Container guidelines."""
    try:
        proc = subprocess.run(
            ["docker", "inspect", container],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
    except FileNotFoundError:
        return [
            CheckResult(
                name="Docker Runtime Inspection",
                category="container",
                weight=55,
                passed=False,
                observed="docker CLI not available in PATH",
                remediation="Run on Docker host or use --demo-hardened / --demo-default.",
            )
        ]

    if proc.returncode != 0 or not proc.stdout.strip():
        return [
            CheckResult(
                name="Container Existence & HostConfig",
                category="container",
                weight=55,
                passed=False,
                observed=f"Container '{container}' not found",
                remediation="Verify container name via 'docker ps -a'.",
            )
        ]

    data = json.loads(proc.stdout)[0]
    host_cfg: dict[str, Any] = data.get("HostConfig", {})
    cfg: dict[str, Any] = data.get("Config", {})

    readonly = bool(host_cfg.get("ReadonlyRootfs", False))
    cap_drop = [c.upper() for c in (host_cfg.get("CapDrop") or [])]
    sec_opts = host_cfg.get("SecurityOpt") or []
    no_new_privs = any("no-new-privileges" in s for s in sec_opts)
    pids_limit = int(host_cfg.get("PidsLimit") or 0)
    memory_limit = int(host_cfg.get("Memory") or 0)
    user_spec = (cfg.get("User") or "root (default)").strip()
    non_root = user_spec not in ("", "0", "root", "root (default)")

    return [
        CheckResult(
            name="ReadonlyRootfs Enabled (Block Webshell Write)",
            category="container",
            weight=18,
            passed=readonly,
            observed=f"ReadonlyRootfs={readonly}",
            remediation="Run container with --read-only and --tmpfs /var/run/apache2,/tmp:rw,noexec,nosuid.",
        ),
        CheckResult(
            name="Linux Capabilities Dropped (--cap-drop=ALL)",
            category="container",
            weight=14,
            passed="ALL" in cap_drop,
            observed=f"CapDrop={cap_drop or ['none']}",
            remediation="Drop all capabilities with --cap-drop=ALL and add only NET_BIND_SERVICE if needed.",
        ),
        CheckResult(
            name="no-new-privileges SecurityOpt",
            category="container",
            weight=10,
            passed=no_new_privs,
            observed=f"SecurityOpt={sec_opts or ['none']}",
            remediation="Pass --security-opt=no-new-privileges:true.",
        ),
        CheckResult(
            name="Resource Quotas (Memory & PidsLimit)",
            category="container",
            weight=8,
            passed=(pids_limit > 0 and memory_limit > 0),
            observed=f"Memory={memory_limit}, PidsLimit={pids_limit}",
            remediation="Enforce --memory=512m --pids-limit=128 to prevent fork-bomb DoS.",
        ),
        CheckResult(
            name="Non-Root Runtime User Check",
            category="container",
            weight=5,
            passed=non_root,
            observed=f"User={user_spec}",
            remediation="Specify --user www-data or non-root UID in Dockerfile/compose.",
        ),
    ]


def build_demo_checks(profile: str) -> list[CheckResult]:
    """Deterministic benchmark profile when demonstrating baseline vs hardened state."""
    hardened = profile == "hardened"
    return [
        CheckResult(
            "Server Tokens & Signature Hidden",
            "http",
            10,
            hardened,
            "Server: Apache" if hardened else "Server: Apache/2.4.25 (Debian)",
            "Set ServerTokens Prod & ServerSignature Off.",
        ),
        CheckResult(
            "Clickjacking Defense (X-Frame-Options / CSP)",
            "http",
            10,
            hardened,
            "XFO=SAMEORIGIN" if hardened else "XFO=missing, CSP=missing",
            "Set Header always set X-Frame-Options \"SAMEORIGIN\".",
        ),
        CheckResult(
            "MIME Sniffing Protection (nosniff)",
            "http",
            8,
            hardened,
            "nosniff" if hardened else "missing",
            "Set Header always set X-Content-Type-Options \"nosniff\".",
        ),
        CheckResult(
            "Content-Security-Policy Strictness",
            "http",
            10,
            hardened,
            "default-src 'self'; script-src 'self'" if hardened else "missing",
            "Enforce CSP without unsafe-inline.",
        ),
        CheckResult(
            "HTTP TRACE Method Disabled",
            "http",
            7,
            hardened,
            "HTTP 405 Method Not Allowed" if hardened else "HTTP 200 OK (XST exposed)",
            "Set TraceEnable off.",
        ),
        CheckResult(
            "ReadonlyRootfs Enabled (Block Webshell Write)",
            "container",
            18,
            hardened,
            f"ReadonlyRootfs={hardened}",
            "Use --read-only + --tmpfs /tmp:rw,noexec,nosuid.",
        ),
        CheckResult(
            "Linux Capabilities Dropped (--cap-drop=ALL)",
            "container",
            14,
            hardened,
            "CapDrop=['ALL']" if hardened else "CapDrop=['none']",
            "Use --cap-drop=ALL.",
        ),
        CheckResult(
            "no-new-privileges SecurityOpt",
            "container",
            10,
            hardened,
            "SecurityOpt=['no-new-privileges:true']" if hardened else "SecurityOpt=['none']",
            "Pass --security-opt=no-new-privileges:true.",
        ),
        CheckResult(
            "Resource Quotas (Memory & PidsLimit)",
            "container",
            8,
            hardened,
            "Memory=536870912, PidsLimit=128" if hardened else "Memory=0, PidsLimit=0",
            "Enforce --memory=512m --pids-limit=128.",
        ),
        CheckResult(
            "Non-Root Runtime User Check",
            "container",
            5,
            hardened,
            "User=33:33" if hardened else "User=root (default)",
            "Drop root privileges cleanly.",
        ),
    ]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Automated Security Gate for DVWA Infrastructure Hardening"
    )
    parser.add_argument("--target", default="http://127.0.0.1:8080/login.php", help="Target HTTP URL")
    parser.add_argument("--container", default="dvwa-lab", help="Docker container name")
    parser.add_argument("--threshold", type=int, default=85, help="Minimum passing score (0-100)")
    parser.add_argument(
        "--demo",
        choices=("default", "hardened"),
        help="Run deterministic offline benchmark profile without Docker/HTTP calls",
    )
    parser.add_argument("--json", action="store_true", help="Print JSON output")
    args = parser.parse_args()

    if args.demo:
        checks = build_demo_checks(args.demo)
    else:
        checks = check_http_surface(args.target) + check_docker_hardening(args.container)

    total_weight = sum(c.weight for c in checks) or 1
    earned = sum(c.weight for c in checks if c.passed)
    score = round((earned / total_weight) * 100)
    verdict = "PASS" if score >= args.threshold else "FAIL"

    report = GateReport(
        target=args.target,
        container=args.container,
        score=score,
        threshold=args.threshold,
        verdict=verdict,
        checks=checks,
    )

    if args.json:
        payload = asdict(report)
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    else:
        print(f"=== DevSecOps Security Gate | Target: {report.target} | Container: {report.container} ===")
        for item in report.checks:
            tag = "[PASS]" if item.passed else "[FAIL]"
            print(f"{tag} (+{item.weight:02d}w) {item.name}: {item.observed}")
            if not item.passed:
                print(f"       -> Fix: {item.remediation}")
        print(f"--- SCORE: {report.score}/100 (Threshold: {report.threshold}) => VERDICT: {report.verdict} ---")

    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
