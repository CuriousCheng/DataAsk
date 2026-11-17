"""人工制品（Artifact）：讨论串里的一次回答，被用户「沉淀」下来，跨会话集中查看。

存储 data/artifacts.json；rows 只存前 200 行，避免文件过大。
"""

from __future__ import annotations

import time

from fastapi import Depends, HTTPException
from pydantic import BaseModel

from .. import store

COLLECTION = "artifacts"
MAX_ROWS = 200


class ArtifactIn(BaseModel):
    thread_id: str
    at: int | None = None  # 指定哪条回答；不传就取最后一条成功的
    title: str = ""


def _read() -> list[dict]:
    data = store.read(COLLECTION, {"items": []})
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


def _read_threads() -> list[dict]:
    data = store.read("threads", {"items": []})
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


def _brief(a: dict) -> dict:
    return {
        "id": a["id"],
        "title": a.get("title", ""),
        "project": a.get("project", ""),
        "thread_id": a.get("thread_id", ""),
        "question": a.get("question", ""),
        "sql": a.get("sql", ""),
        "columns": a.get("columns", []),
        "row_count": a.get("row_count", 0),
        "created_at": a.get("created_at"),
        "created_by": a.get("created_by", ""),
    }


def register(app, current_user, require) -> None:
    @app.get("/api/artifacts")
    async def list_artifacts(
        project: str = "", q: str = "", user: dict = Depends(current_user)
    ) -> dict:
        items = _read()
        if project:
            items = [a for a in items if a.get("project") == project]
        if q:
            key = q.lower()
            items = [
                a
                for a in items
                if key in str(a.get("title", "")).lower()
                or key in str(a.get("question", "")).lower()
            ]
        items.sort(key=lambda a: a.get("created_at") or 0, reverse=True)
        return {"items": [_brief(a) for a in items]}

    @app.get("/api/artifacts/{artifact_id}")
    async def get_artifact(artifact_id: str, user: dict = Depends(current_user)) -> dict:
        for a in _read():
            if a["id"] == artifact_id:
                return {"ok": True, "artifact": a}
        raise HTTPException(404, "人工制品不存在")

    @app.post("/api/artifacts")
    async def create_artifact(body: ArtifactIn, user: dict = Depends(current_user)) -> dict:
        thread = next((t for t in _read_threads() if t["id"] == body.thread_id), None)
        if not thread:
            raise HTTPException(404, "讨论串不存在")

        msgs = thread.get("messages") or []
        assistant = None
        if body.at:
            assistant = next(
                (m for m in msgs if m.get("role") == "assistant" and m.get("at") == body.at),
                None,
            )
        if assistant is None:
            for m in reversed(msgs):
                if m.get("role") == "assistant" and m.get("ok"):
                    assistant = m
                    break
        if assistant is None:
            raise HTTPException(400, "这个讨论串里还没有成功的回答")

        question = ""
        for m in msgs:
            if m.get("role") == "user" and m.get("at", 0) <= (assistant.get("at") or 0):
                question = m.get("content", "")

        data = assistant.get("data") or {}
        rows = data.get("rows") or []
        items = _read()
        item = {
            "id": store.next_id("art", items),
            "thread_id": body.thread_id,
            "project": thread.get("project", ""),
            "title": (body.title or "").strip() or question[:50] or "人工制品",
            "question": question,
            "sql": assistant.get("sql", ""),
            "columns": data.get("columns") or [],
            "rows": rows[:MAX_ROWS],
            "row_count": data.get("row_count", len(rows)),
            "created_at": int(time.time()),
            "created_by": user["name"],
        }
        items.append(item)
        await store.write(COLLECTION, {"items": items})
        return {"ok": True, "artifact": _brief(item)}

    @app.delete("/api/artifacts/{artifact_id}")
    async def delete_artifact(
        artifact_id: str, user: dict = Depends(current_user)
    ) -> dict:
        items = _read()
        before = len(items)
        items = [a for a in items if a["id"] != artifact_id]
        if len(items) == before:
            raise HTTPException(404, "人工制品不存在")
        await store.write(COLLECTION, {"items": items})
        return {"ok": True}
