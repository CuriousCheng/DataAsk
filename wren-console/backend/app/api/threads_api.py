"""讨论串：把 /api/ask 的一问一答存下来，可以回看、接着问。

存储就是 data/threads.json，一条记录里带 messages。
"""

from __future__ import annotations

import time

from fastapi import Depends, HTTPException
from pydantic import BaseModel

from .. import logs, store
from ..core import wren_project

COLLECTION = "threads"


class ThreadIn(BaseModel):
    project: str
    title: str | None = None


class AskIn(BaseModel):
    question: str
    remember: bool = False


class TitleIn(BaseModel):
    title: str


def _read() -> list[dict]:
    data = store.read(COLLECTION, {"items": []})
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


def _public(t: dict, with_messages: bool = False) -> dict:
    base = {
        "id": t["id"],
        "project": t.get("project", ""),
        "title": t.get("title", ""),
        "created_at": t.get("created_at"),
        "updated_at": t.get("updated_at"),
        "created_by": t.get("created_by", ""),
        "count": len(t.get("messages", [])),
    }
    if with_messages:
        base["messages"] = t.get("messages", [])
    return base


def register(app, current_user, require) -> None:
    from .ask import run_ask

    @app.get("/api/threads")
    async def list_threads(project: str = "", user: dict = Depends(current_user)) -> dict:
        items = _read()
        if project:
            items = [t for t in items if t.get("project") == project]
        items.sort(key=lambda t: t.get("updated_at") or 0, reverse=True)
        return {"items": [_public(t) for t in items]}

    @app.post("/api/threads")
    async def create_thread(body: ThreadIn, user: dict = Depends(current_user)) -> dict:
        project = body.project.strip()
        if project not in wren_project.list_projects():
            raise HTTPException(404, "业务不存在")
        items = _read()
        now = int(time.time())
        item = {
            "id": store.next_id("t", items),
            "project": project,
            "title": (body.title or "").strip() or "新讨论串",
            "created_at": now,
            "updated_at": now,
            "created_by": user["name"],
            "messages": [],
        }
        items.append(item)
        await store.write(COLLECTION, {"items": items})
        return {"ok": True, "thread": _public(item, with_messages=True)}

    @app.get("/api/threads/{thread_id}")
    async def get_thread(thread_id: str, user: dict = Depends(current_user)) -> dict:
        for t in _read():
            if t["id"] == thread_id:
                return {"ok": True, "thread": _public(t, with_messages=True)}
        raise HTTPException(404, "讨论串不存在")

    @app.patch("/api/threads/{thread_id}")
    async def rename_thread(
        thread_id: str, body: TitleIn, user: dict = Depends(current_user)
    ) -> dict:
        items = _read()
        for t in items:
            if t["id"] == thread_id:
                t["title"] = body.title.strip() or t["title"]
                t["updated_at"] = int(time.time())
                await store.write(COLLECTION, {"items": items})
                return {"ok": True, "thread": _public(t)}
        raise HTTPException(404, "讨论串不存在")

    @app.delete("/api/threads/{thread_id}")
    async def delete_thread(thread_id: str, user: dict = Depends(current_user)) -> dict:
        items = _read()
        before = len(items)
        items = [t for t in items if t["id"] != thread_id]
        if len(items) == before:
            raise HTTPException(404, "讨论串不存在")
        await store.write(COLLECTION, {"items": items})
        return {"ok": True}

    @app.post("/api/threads/{thread_id}/share")
    async def share_thread(thread_id: str, user: dict = Depends(current_user)) -> dict:
        import secrets as _secrets

        items = _read()
        for t in items:
            if t["id"] != thread_id:
                continue
            if not t.get("share_token"):
                t["share_token"] = _secrets.token_urlsafe(18)
            await store.write(COLLECTION, {"items": items})
            return {"ok": True, "token": t["share_token"], "path": f"/embed/{t['share_token']}"}
        raise HTTPException(404, "讨论串不存在")

    @app.delete("/api/threads/{thread_id}/share")
    async def unshare_thread(thread_id: str, user: dict = Depends(current_user)) -> dict:
        items = _read()
        for t in items:
            if t["id"] == thread_id:
                t.pop("share_token", None)
                await store.write(COLLECTION, {"items": items})
                return {"ok": True}
        raise HTTPException(404, "讨论串不存在")

    @app.get("/api/public/threads/{token}")
    async def public_thread(token: str) -> dict:
        for t in _read():
            if t.get("share_token") and t["share_token"] == token:
                return {
                    "ok": True,
                    "thread": {
                        "id": t["id"],
                        "project": t.get("project", ""),
                        "title": t.get("title", ""),
                        "created_at": t.get("created_at"),
                        "messages": t.get("messages", []),
                    },
                }
        raise HTTPException(404, "分享链接无效")

    @app.post("/api/threads/{thread_id}/ask")
    async def ask_in_thread(
        thread_id: str, body: AskIn, user: dict = Depends(current_user)
    ) -> dict:
        items = _read()
        thread = next((t for t in items if t["id"] == thread_id), None)
        if not thread:
            raise HTTPException(404, "讨论串不存在")

        question = body.question.strip()
        if not question:
            raise HTTPException(400, "问题不能为空")

        started = int(time.time())
        t0 = time.time()
        try:
            result = await run_ask(thread["project"], question, body.remember)
        except HTTPException as e:
            result = {"ok": False, "stage": "error", "error": str(e.detail)}

        thread.setdefault("messages", []).append(
            {
                "role": "user",
                "content": question,
                "at": started,
            }
        )
        thread["messages"].append(
            {
                "role": "assistant",
                "ok": bool(result.get("ok")),
                "sql": result.get("sql"),
                "data": result.get("data"),
                "error": result.get("error"),
                "stage": result.get("stage"),
                "at": int(time.time()),
            }
        )
        if thread.get("title") in ("", "新讨论串"):
            thread["title"] = question[:40]
        thread["updated_at"] = int(time.time())
        await store.write(COLLECTION, {"items": items})
        try:
            await logs.add(
                {
                    "user": user["name"],
                    "via": user.get("via", "web"),
                    "project": thread["project"],
                    "question": question,
                    "ok": bool(result.get("ok")),
                    "stage": "ok" if result.get("ok") else str(result.get("stage") or "error"),
                    "ms": int((time.time() - t0) * 1000),
                    "sql": str(result.get("sql") or "")[:2000],
                    "thread": thread_id,
                }
            )
        except Exception:  # noqa: BLE001
            pass
        return {"ok": True, "result": result, "thread": _public(thread, with_messages=True)}
