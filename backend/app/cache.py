import time
from typing import Any

_store: dict[str, tuple[Any, float]] = {}

def get(key: str, ttl: int = 3600) -> Any | None:
    if key in _store:
        val, ts = _store[key]
        if time.time() - ts < ttl:
            return val
        del _store[key]
    return None

def set(key: str, value: Any) -> None:
    _store[key] = (value, time.time())
