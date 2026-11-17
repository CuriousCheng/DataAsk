"""API Key：给外部调用方发凭证（MCP / 脚本 / 第三方）。

key 只在这里生成一次，磁盘上只存 sha256 摘要，丢了没法找回。
"""

from __future__ import annotations

import hashlib
import secrets
import time

from . import store

COLLECTION = "apikeys"
DEFAULTS = {"items": []}


def _read() -> dict:
    data = store.read(COLLECTION, DEFAULTS)
    if not isinstance(data, dict) or "items" not in data:
        return {"items": []}
    return data


def _digest(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


async def create(name: str, role: str, created_by: str) -> tuple[dict, str]:
    data = _read()
    raw = "dak_" + secrets.token_urlsafe(24)
    item = {
        "id": store.next_id("key", data["items"]),
        "name": name,
        "role": role,
        "prefix": raw[:12],
        "hash": _digest(raw),
        "created_at": int(time.time()),
        "created_by": created_by,
        "last_used": None,
    }
    data["items"].append(item)
    await store.write(COLLECTION, data)
    public = {k: v for k, v in item.items() if k != "hash"}
    return public, raw


def list_keys() -> list[dict]:
    return [{k: v for k, v in i.items() if k != "hash"} for i in _read()["items"]]


async def delete(key_id: str) -> bool:
    data = _read()
    before = len(data["items"])
    data["items"] = [i for i in data["items"] if i.get("id") != key_id]
    if len(data["items"]) == before:
        return False
    await store.write(COLLECTION, data)
    return True


def verify(raw: str) -> dict | None:
    """校验 key，命中就返回身份（并异步更新 last_used 由调用方决定）。"""
    if not raw:
        return None
    h = _digest(raw)
    for item in _read()["items"]:
        if secrets.compare_digest(item.get("hash", ""), h):
            return {
                "id": item["id"],
                "name": item["name"],
                "role": item.get("role", "viewer"),
                "via": "apikey",
            }
    return None


async def touch(key_id: str) -> None:
    data = _read()
    for item in data["items"]:
        if item.get("id") == key_id:
            item["last_used"] = int(time.time())
            await store.write(COLLECTION, data)
            return
