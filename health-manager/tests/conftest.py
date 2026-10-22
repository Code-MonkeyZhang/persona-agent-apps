"""Shared fixtures."""

import importlib.util
from pathlib import Path

import pytest


@pytest.fixture
def import_legacy():
    """Load scripts/import_legacy.py as a module for its pure functions."""
    path = Path(__file__).resolve().parent.parent / "scripts" / "import_legacy.py"
    spec = importlib.util.spec_from_file_location("import_legacy", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
