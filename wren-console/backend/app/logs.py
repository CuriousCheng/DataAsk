"""调用日志：记录每次 /api/ask 的请求（谁、哪个业务、问的什么、成没成、多久）。

只保留最近 MAX_ITEMS 条，内存里排队写，避免拖慢提问。
"""

from __future__ import annotations

import time

from . import store

COLLECTION = "logs"
MAX_ITEMS = 500


def _read() -> list[dict]:
    data = store.read(COLLECTION, {"items": []})
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


async def add(entry: dict) -> None:
    items = _read()
    items.append(
        {
            "id": store.next_id("log", items),
            "ts": int(time.time()),
            **entry,
        }
    )
    if len(items) > MAX_ITEMS:
        items = items[-MAX_ITEMS:]
    await store.write(COLLECTION, {"items": items})


def list_logs(limit: int = 100, project: str = "", only_failed: bool = False) -> list[dict]:
    items = _read()
    if project:
        items = [i for i in items if i.get("project") == project]
    if only_failed:
        items = [i for i in items if not i.get("ok")]
    return list(reversed(items))[: max(1, min(limit, MAX_ITEMS))]


async def clear() -> None:
    await store.write(COLLECTION, {"items": []})
