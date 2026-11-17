"""视图（views）：views/<名>/metadata.yml + sql.yml。

视图就是一条命名 SQL，建好后可以像表一样被提问引用。
"""

from __future__ import annotations

import shutil

import yaml
from fastapi import Depends, HTTPException
from pydantic import BaseModel

from ..core.wren_project import project_dir

VIEW_DIR = "views"
ALLOWED_HEAD = ("select", "with")


class ViewIn(BaseModel):
    name: str
    description: str = ""
    statement: str


class ViewJsonIn(BaseModel):
    data: dict


def _safe_name(view: str) -> str:
    name = (view or "").strip()
    if not name or "/" in name or "\\" in name or name.startswith("."):
        raise HTTPException(400, "视图名不合法")
    return name


def _view_dir(project: str, view: str):
    return project_dir(project) / VIEW_DIR / _safe_name(view)


def _read_view(project: str, view: str) -> dict:
    d = _view_dir(project, view)
    meta_p = d / "metadata.yml"
    sql_p = d / "sql.yml"
    if not meta_p.exists() and not sql_p.exists():
        raise HTTPException(404, "视图不存在")
    meta = {}
    if meta_p.exists():
        try:
            meta = yaml.safe_load(meta_p.read_text("utf-8")) or {}
        except yaml.YAMLError as e:  # noqa: BLE001
            raise HTTPException(400, f"metadata.yml 解析失败：{e}") from e
    statement = ""
    if sql_p.exists():
        try:
            sql = yaml.safe_load(sql_p.read_text("utf-8")) or {}
        except yaml.YAMLError as e:  # noqa: BLE001
            raise HTTPException(400, f"sql.yml 解析失败：{e}") from e
        statement = str(sql.get("statement") or "")
    return {
        "name": meta.get("name") or _safe_name(view),
        "properties": meta.get("properties") or {},
        "statement": statement,
    }


def _write_view(project: str, view: str, data: dict) -> None:
    name = _safe_name(view)
    statement = str(data.get("statement") or "").strip()
    if not statement:
        raise HTTPException(400, "SQL 不能为空")
    head = statement.lstrip().split(None, 1)[0].lower()
    if not head.startswith(ALLOWED_HEAD):
        raise HTTPException(400, "视图只能是 SELECT / WITH 查询")

    d = _view_dir(project, name)
    d.mkdir(parents=True, exist_ok=True)
    props = data.get("properties") or {}
    meta = {"name": name, "properties": {"description": props.get("description", "")}}
    (d / "metadata.yml").write_text(
        yaml.safe_dump(meta, allow_unicode=True, sort_keys=False), "utf-8"
    )
    (d / "sql.yml").write_text(
        yaml.safe_dump({"statement": statement}, allow_unicode=True, sort_keys=False),
        "utf-8",
    )


def register(app, current_user, require) -> None:
    @app.get("/api/projects/{name}/views")
    async def list_views(name: str, user: dict = Depends(current_user)) -> dict:
        base = project_dir(name)
        if not base.exists():
            raise HTTPException(404, "业务不存在")
        vdir = base / VIEW_DIR
        items = []
        if vdir.exists():
            for p in sorted(vdir.iterdir()):
                if not p.is_dir():
                    continue
                try:
                    data = _read_view(name, p.name)
                except HTTPException:
                    continue
                items.append(
                    {
                        "name": data["name"],
                        "description": (data.get("properties") or {}).get("description", ""),
                        "statement": data["statement"],
                    }
                )
        return {"items": items}

    @app.get("/api/projects/{name}/views/{view}/json")
    async def get_view(name: str, view: str, user: dict = Depends(current_user)) -> dict:
        return {"ok": True, "data": _read_view(name, view)}

    @app.post("/api/projects/{name}/views")
    async def create_view(
        name: str, body: ViewIn, user: dict = Depends(require("editor"))
    ) -> dict:
        view = _safe_name(body.name)
        if _view_dir(name, view).exists():
            raise HTTPException(400, f"视图 {view} 已存在")
        _write_view(
            name,
            view,
            {"properties": {"description": body.description}, "statement": body.statement},
        )
        return {"ok": True, "view": view}

    @app.put("/api/projects/{name}/views/{view}/json")
    async def put_view(
        name: str, view: str, body: ViewJsonIn, user: dict = Depends(require("editor"))
    ) -> dict:
        _write_view(name, view, body.data)
        return {"ok": True}

    @app.delete("/api/projects/{name}/views/{view}")
    async def delete_view(
        name: str, view: str, user: dict = Depends(require("editor"))
    ) -> dict:
        d = _view_dir(name, view)
        if not d.exists():
            raise HTTPException(404, "视图不存在")
        shutil.rmtree(d)
        return {"ok": True}
