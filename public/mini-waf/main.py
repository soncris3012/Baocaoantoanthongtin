"""
main.py - Dual-Plane Entrypoint for Mini-WAF.
Runs the Reverse Proxy on port 8080 and the isolated Admin Dashboard on port 8888 concurrently.
"""

from __future__ import annotations

import asyncio
import os

import uvicorn

from waf.monitoring.dashboard import create_admin_app
from waf.proxy.forward import WafRuntime, create_proxy_app


def build_apps(db_path: str | None = None) -> tuple[object, object, WafRuntime]:
    runtime = WafRuntime.from_env(db_path=db_path)
    proxy_app = create_proxy_app(runtime)
    admin_app = create_admin_app(runtime)
    return proxy_app, admin_app, runtime


async def run_both_planes() -> None:
    proxy_app, admin_app, runtime = build_apps()
    proxy_host = os.getenv("PROXY_HOST", "0.0.0.0")
    proxy_port = int(os.getenv("PROXY_PORT", "8080"))
    admin_host = os.getenv("ADMIN_HOST", "127.0.0.1")
    admin_port = int(os.getenv("ADMIN_PORT", "8888"))

    proxy_srv = uvicorn.Server(
        uvicorn.Config(proxy_app, host=proxy_host, port=proxy_port, log_level="warning", server_header=False)
    )
    admin_srv = uvicorn.Server(
        uvicorn.Config(admin_app, host=admin_host, port=admin_port, log_level="warning", server_header=False)
    )

    print(f"[Mini-WAF] Proxy Server listening on http://{proxy_host}:{proxy_port} -> {runtime.upstream_url}")
    print(f"[Mini-WAF] Admin Dashboard listening on http://{admin_host}:{admin_port}")
    await asyncio.gather(proxy_srv.serve(), admin_srv.serve())


if __name__ == "__main__":
    asyncio.run(run_both_planes())
