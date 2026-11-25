"""Thin wrapper delegating benchmark execution to tests/benchmark.py (single source of truth)."""

from tests.benchmark import main

if __name__ == "__main__":
    main()
