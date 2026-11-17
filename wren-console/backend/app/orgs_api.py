"""组织：把用户分到组织里，带组织级角色。

存储 data/orgs.json：
  {"items": [{"id","name","code","created_at","created_by","members":[{"user","role"}]}]}

组织和用户是两层：用户全局唯一，组织成员关系单独存。
"""

from __future__ import annotations

import secrets
import time

from fastapi import Depends, HTTPException
from pydantic import BaseModel

from . import store

COLLECTION = "orgs"
ROLES = ("owner", "admin", "member")


class OrgIn(BaseModel):
    name: str
    code: str = ""


class OrgPatch(BaseModel):
    name: str | None = None


class MemberIn(BaseModel):
    user: str
    role: str = "member"


def _read() -> list[dict]:
    data = store.read(COLLECTION, {"items": []})
    items = data.get("items") if isinstance(data, dict) else None
    return items if isinstance(items, list) else []


def _strip(o: dict) -> dict:
    return {
        "id": o["id"],
        "name": o.get("name", ""),
        "code": o.get("code", ""),
        "created_at": o.get("created_at"),
        "created_by": o.get("created_by", ""),
        "members": o.get("members", []),
    }


def register(app, current_user, require) -> None:
    @app.get("/api/orgs")
    async def list_orgs(user: dict = Depends(current_user)) -> dict:
        return {"items": [_strip(o) for o in _read()]}

    @app.post("/api/orgs")
    async def create_org(body: OrgIn, user: dict = Depends(require("admin"))) -> dict:
        name = body.name.strip()
        if not name:
            raise HTTPException(400, "组织名不能为空")
        items = _read()
        if any(o.get("name") == name for o in items):
            raise HTTPException(400, "同名组织已存在")
        item = {
            "id": store.next_id("org", items),
            "name": name,
            "code": body.code.strip() or secrets.token_hex(4),
            "created_at": int(time.time()),
            "created_by": user["name"],
            "members": [{"user": user["name"], "role": "owner"}],
        }
        items.append(item)
        await store.write(COLLECTION, {"items": items})
        return {"ok": True, "org": _strip(item)}

    @app.patch("/api/orgs/{org_id}")
    async def patch_org(
        org_id: str, body: OrgPatch, user: dict = Depends(require("admin"))
    ) -> dict:
        items = _read()
        for o in items:
            if o["id"] == org_id:
                if body.name is not None:
                    o["name"] = body.name.strip() or o["name"]
                await store.write(COLLECTION, {"items": items})
                return {"ok": True, "org": _strip(o)}
        raise HTTPException(404, "组织不存在")

    @app.delete("/api/orgs/{org_id}")
    async def delete_org(org_id: str, user: dict = Depends(require("admin"))) -> dict:
        items = _read()
        before = len(items)
        items = [o for o in items if o["id"] != org_id]
        if len(items) == before:
            raise HTTPException(404, "组织不存在")
        await store.write(COLLECTION, {"items": items})
        return {"ok": True}

    @app.post("/api/orgs/{org_id}/members")
    async def add_member(
        org_id: str, body: MemberIn, user: dict = Depends(require("admin"))
    ) -> dict:
        if body.role not in ROLES:
            raise HTTPException(400, "角色只能是 owner / admin / member")
        items = _read()
        for o in items:
            if o["id"] != org_id:
                continue
            members = o.setdefault("members", [])
            if any(m.get("user") == body.user for m in members):
                raise HTTPException(400, "这个用户已经在组织里")
            members.append({"user": body.user, "role": body.role})
            await store.write(COLLECTION, {"items": items})
            return {"ok": True, "org": _strip(o)}
        raise HTTPException(404, "组织不存在")

    @app.patch("/api/orgs/{org_id}/members/{member}")
    async def set_member_role(
        org_id: str,
        member: str,
        body: MemberIn,
        user: dict = Depends(require("admin")),
    ) -> dict:
        if body.role not in ROLES:
            raise HTTPException(400, "角色只能是 owner / admin / member")
        items = _read()
        for o in items:
            if o["id"] != org_id:
                continue
            for m in o.setdefault("members", []):
                if m.get("user") == member:
                    m["role"] = body.role
                    await store.write(COLLECTION, {"items": items})
                    return {"ok": True, "org": _strip(o)}
            raise HTTPException(404, "成员不存在")
        raise HTTPException(404, "组织不存在")

    @app.delete("/api/orgs/{org_id}/members/{member}")
    async def remove_member(
        org_id: str, member: str, user: dict = Depends(require("admin"))
    ) -> dict:
        items = _read()
        for o in items:
            if o["id"] != org_id:
                continue
            before = len(o.get("members", []))
            o["members"] = [m for m in o.get("members", []) if m.get("user") != member]
            if len(o["members"]) == before:
                raise HTTPException(404, "成员不存在")
            await store.write(COLLECTION, {"items": items})
            return {"ok": True, "org": _strip(o)}
        raise HTTPException(404, "组织不存在")
