"""API Key 与调用日志的 REST 接口。"""

from __future__ import annotations

from fastapi import Depends, HTTPException
from pydantic import BaseModel

from .. import apikeys, logs


class KeyIn(BaseModel):
    name: str
    role: str = "viewer"


def register(app, current_user, require) -> None:
    @app.get("/api/keys")
    async def list_keys(user: dict = Depends(require("admin"))) -> dict:
        return {"items": apikeys.list_keys()}

    @app.post("/api/keys")
    async def create_key(body: KeyIn, user: dict = Depends(require("admin"))) -> dict:
        name = body.name.strip()
        if not name:
            raise HTTPException(400, "名字不能为空")
        if body.role not in ("admin", "editor", "viewer"):
            raise HTTPException(400, "role 只能是 admin / editor / viewer")
        item, raw = await apikeys.create(name, body.role, user["name"])
        # 明文只在这里返回一次
        return {"ok": True, "key": item, "secret": raw}

    @app.delete("/api/keys/{key_id}")
    async def delete_key(key_id: str, user: dict = Depends(require("admin"))) -> dict:
        ok = await apikeys.delete(key_id)
        if not ok:
            raise HTTPException(404, "key 不存在")
        return {"ok": True}

    @app.get("/api/logs")
    async def list_logs(
        limit: int = 100,
        project: str = "",
        only_failed: bool = False,
        user: dict = Depends(require("admin")),
    ) -> dict:
        return {"items": logs.list_logs(limit=limit, project=project, only_failed=only_failed)}

    @app.delete("/api/logs")
    async def clear_logs(user: dict = Depends(require("admin"))) -> dict:
        await logs.clear()
        return {"ok": True}
