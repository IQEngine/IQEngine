from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from helpers.authorization import get_current_user

from .database import db
from .models import Plugin

router = APIRouter()


@router.post("/api/plugins/", status_code=201, response_model=Plugin)
@router.post("/api/plugins", status_code=201, response_model=Plugin)
async def create_plugin(
    plugin: Plugin,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Create a new plugin. The plugin will be henceforth identified by name which
    must be unique or this function will return a 400.
    """
    if await db().plugins.find_one({"name": plugin.name}):
        raise HTTPException(status_code=409, detail="plugin Already Exists")

    db().plugins.insert_one(plugin.dict(by_alias=True, exclude_unset=True))
    return plugin


@router.get("/api/plugins/", response_model=list[Plugin])
@router.get("/api/plugins", response_model=list[Plugin])
async def get_plugins(current_user: Optional[dict] = Depends(get_current_user)):
    return list(await db().plugins.find({}).to_list(1_000_000))


@router.get("/api/plugins/{plugin_name}", response_model=Plugin)
async def get_plugin(
    plugin_name: str,
    current_user: Optional[dict] = Depends(get_current_user),
):
    plugin = await db().plugins.find_one({"name": plugin_name})
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin


@router.put("/api/plugins/{plugin_name}", response_model=Plugin)
async def update_plugin(
    plugin_name: str,
    plugin: Plugin,
    current_user: Optional[dict] = Depends(get_current_user),
):
    plugin = await db().plugins.find_one_and_update(
        {"name": plugin_name},
        {"$set": plugin.dict(by_alias=True, exclude_unset=True)},
        return_document=True,
    )
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin


@router.delete("/api/plugins/{plugin_name}")
async def delete_plugin(plugin_name: str, current_user: Optional[dict] = Depends(get_current_user)):
    plugin = await db().plugins.find_one_and_delete({"name": plugin_name}, {"_id": 0})
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin
