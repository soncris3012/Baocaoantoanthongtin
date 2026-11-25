"""
run_benchmark.py - Automated Quantitative Evaluator for Mini-WAF.
Measures Confusion Matrix (TP, FP, TN, FN), Precision, Recall, F1-score, TPR, FPR,
and Latency percentiles (Mean, Median, p95) comparing WAF OFF vs MONITOR vs BLOCKING,
plus Backend Request Isolation verification and Active Defense 429/Auto-Ban checks.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import time
from pathlib import Path

import httpx

from target_web.app import create_target_app
from waf.proxy.forward import WafRuntime, create_proxy_app


def percentile(sorted_values: list[float], pct: float) -> float:
    if not sorted_values:
        return 0.0
    idx = (len(sorted_values) - 1) * pct
    lower = int(idx)
    upper = min(lower + 1, len(sorted_values) - 1)
    frac = idx - lower
    return sorted_values[lower] * (1.0 - frac) + sorted_values[upper] * frac


async def _run_pass(
    client: httpx.AsyncClient,
    dataset: list[dict[str, object]],
    iterations: int = 1,
) -> dict[str, object]:
    tp = fp = tn = fn = 0
    latencies_ms: list[float] = []
    misclassified: list[dict[str, object]] = []
    group_stats: dict[str, dict[str, int]] = {}

    for it in range(iterations):
        for item in dataset:
            method = str(item["method"])
            path = str(item["path"])
            query = str(item.get("query", ""))
            body = str(item.get("body", "")).encode("utf-8")
            headers = dict(item.get("headers", {}))
            url = f"{path}?{query}" if query else path

            t0 = time.perf_counter()
            resp = await client.request(method=method, url=url, content=body, headers=headers)
            dt_ms = (time.perf_counter() - t0) * 1000.0
            latencies_ms.append(dt_ms)

            if it > 0:
                continue  # Score classification on canonical pass 0; aggregate latency across all iterations

            is_blocked = resp.status_code == 403
            is_malicious = item["label"] == "malicious"
            grp = str(item["group"])
            g = group_stats.setdefault(grp, {"total": 0, "blocked": 0, "allowed": 0})
            g["total"] += 1
            if is_blocked:
                g["blocked"] += 1
            else:
                g["allowed"] += 1

            if is_malicious and is_blocked:
                tp += 1
            elif not is_malicious and is_blocked:
                fp += 1
                misclassified.append({"id": item["id"], "type": "FP", "query": query})
            elif not is_malicious and not is_blocked:
                tn += 1
            else:
                fn += 1
                misclassified.append({"id": item["id"], "type": "FN", "query": query})

    lat_sorted = sorted(latencies_ms)
    precision = (tp / (tp + fp) * 100.0) if (tp + fp) > 0 else 0.0
    recall_tpr = (tp / (tp + fn) * 100.0) if (tp + fn) > 0 else 0.0
    fpr = (fp / (fp + tn) * 100.0) if (fp + tn) > 0 else 0.0
    f1 = (2 * precision * recall_tpr / (precision + recall_tpr)) if (precision + recall_tpr) > 0 else 0.0

    return {
        "tp": tp,
        "fp": fp,
        "tn": tn,
        "fn": fn,
        "precision_pct": round(precision, 2),
        "recall_tpr_pct": round(recall_tpr, 2),
        "fpr_pct": round(fpr, 2),
        "f1_pct": round(f1, 2),
        "latency_mean_ms": round(statistics.mean(lat_sorted), 3),
        "latency_median_ms": round(statistics.median(lat_sorted), 3),
        "latency_p95_ms": round(percentile(lat_sorted, 0.95), 3),
        "group_stats": group_stats,
        "misclassified": misclassified,
    }


async def run_self_contained_benchmark(dataset_path: Path, iterations: int = 3) -> dict[str, object]:
    """Spin up Target Web + Mini-WAF over in-memory ASGI transports to benchmark accurately."""
    dataset = json.loads(dataset_path.read_text(encoding="utf-8"))
    target_app = create_target_app(db_path="/tmp/bench_target.db", security_mode="vulnerable")

    upstream_transport = httpx.ASGITransport(app=target_app)
    upstream_client = httpx.AsyncClient(base_url="http://target_web:8000", transport=upstream_transport)

    db_file = Path("/tmp/bench_waf_logs.db")
    if db_file.exists():
        db_file.unlink()
    runtime = WafRuntime.from_env(db_path=str(db_file), http_client=upstream_client)
    # Disable rate-limit/auto-ban during the 100-sample accuracy & latency pass so sample #4 doesn't lock out #5
    runtime.defense.enabled = False
    proxy_app = create_proxy_app(runtime)

    try:
        proxy_transport = httpx.ASGITransport(app=proxy_app)
        async with httpx.AsyncClient(base_url="http://mini-waf:8080", transport=proxy_transport) as waf_client:
            # Warmup SQLite & regex path
            await waf_client.get("/search?q=SV001")

            # 1. Mode OFF (Passthrough baseline)
            target_app.state.backend_requests_received = 0
            runtime.mode = "OFF"
            off_res = await _run_pass(waf_client, dataset, iterations=iterations)
            off_backend_hits = target_app.state.backend_requests_received

            # 2. Mode MONITOR (Detection only)
            target_app.state.backend_requests_received = 0
            runtime.mode = "MONITOR"
            mon_res = await _run_pass(waf_client, dataset, iterations=1)
            mon_backend_hits = target_app.state.backend_requests_received

            # 3. Mode BLOCKING (Active prevention)
            target_app.state.backend_requests_received = 0
            runtime.mode = "BLOCKING"
            blk_res = await _run_pass(waf_client, dataset, iterations=iterations)
            blk_backend_hits = target_app.state.backend_requests_received

            # Query DB telemetry summary from MONITOR + BLOCKING
            repo_stats = await runtime.repo.get_stats(limit_logs=10)

            # 4. Separate Active Defense Verification (Rate Limit 429 & Auto-Ban)
            runtime.defense.enabled = True
            rl_statuses = []
            for _ in range(runtime.defense._sliding.max_requests + 3):
                r = await waf_client.get("/search?q=SV001")
                rl_statuses.append(r.status_code)
            rate_limited_429_hits = sum(1 for c in rl_statuses if c == 429)

            runtime.defense._sliding.reset()
            ban_statuses = []
            for _ in range(4):
                r = await waf_client.get("/search?q=1' OR 1=1--")
                ban_statuses.append(r.status_code)
    finally:
        await upstream_client.aclose()

    overhead_mean = round(float(blk_res["latency_mean_ms"]) - float(off_res["latency_mean_ms"]), 3)
    overhead_p95 = round(float(blk_res["latency_p95_ms"]) - float(off_res["latency_p95_ms"]), 3)

    return {
        "dataset_size": len(dataset),
        "iterations": iterations,
        "off_mode": {**off_res, "backend_hits": off_backend_hits},
        "monitor_mode": {
            **mon_res,
            "backend_hits": mon_backend_hits,
            "monitored_logged": repo_stats["monitored_count"],
        },
        "blocking_mode": {**blk_res, "backend_hits": blk_backend_hits},
        "latency_overhead_ms": {
            "delta_mean_ms": overhead_mean,
            "delta_p95_ms": overhead_p95,
        },
        "active_defense_check": {
            "rate_limited_429_hits": rate_limited_429_hits,
            "autoban_sequence_statuses": ban_statuses,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Mini-WAF Scientific Benchmark Suite")
    parser.add_argument("--dataset", default=str(Path(__file__).resolve().parent / "dataset.json"))
    parser.add_argument("--iterations", type=int, default=3)
    parser.add_argument("--json-out", help="Optional path to save JSON report")
    args = parser.parse_args()

    report = asyncio.run(run_self_contained_benchmark(Path(args.dataset), iterations=args.iterations))
    blk = report["blocking_mode"]
    off = report["off_mode"]
    print(f"=== Mini-WAF Benchmark Report ({report['dataset_size']} samples x {report['iterations']} iters) ===")
    print(f"WAF OFF      : Backend Hits={off['backend_hits']} | Mean={off['latency_mean_ms']}ms | Median={off['latency_median_ms']}ms | p95={off['latency_p95_ms']}ms")
    print(f"WAF BLOCKING : TP={blk['tp']} FP={blk['fp']} TN={blk['tn']} FN={blk['fn']}")
    print(f"               TPR(Recall)={blk['recall_tpr_pct']}% | FPR={blk['fpr_pct']}% | Precision={blk['precision_pct']}% | F1={blk['f1_pct']}%")
    print(f"               Mean={blk['latency_mean_ms']}ms | Median={blk['latency_median_ms']}ms | p95={blk['latency_p95_ms']}ms | Overhead Delta={report['latency_overhead_ms']['delta_mean_ms']}ms")
    print(f"Backend Shielding: Only {blk['backend_hits']} benign hits reached Target Web in BLOCKING mode!")
    print(f"Active Defense   : 429 triggers={report['active_defense_check']['rate_limited_429_hits']}, Auto-Ban seq={report['active_defense_check']['autoban_sequence_statuses']}")
    if blk["misclassified"]:
        print(f"Misclassified    : {blk['misclassified']}")

    if args.json_out:
        Path(args.json_out).write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
