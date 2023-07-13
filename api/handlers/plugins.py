from database import plugin_repo
from database.models import Plugin
from fastapi import APIRouter, Depends, HTTPException
from motor.core import AgnosticCollection

router = APIRouter()


@router.post("/api/plugins", status_code=201, response_model=Plugin)
async def create_plugin(
    plugin: Plugin,
    plugins: AgnosticCollection = Depends(plugin_repo.collection),
):
    """
    Create a new plugin. The plugin will be henceforth identified by name which
    must be unique or this function will return a 400.
    """
    if await plugins.find_one({"name": plugin.name}):
        raise HTTPException(status_code=409, detail="plugin Already Exists")

    plugins.insert_one(plugin.dict(by_alias=True, exclude_unset=True))
    return plugin


@router.get("/api/plugins", response_model=list[Plugin])
async def get_plugins(
    plugins: AgnosticCollection = Depends(plugin_repo.collection),
):
    """
    Get a list of all plugins.
    """
    return list(await plugins.find({}).to_list(1_000_000))


@router.get("/api/plugins/{plugin_name}", response_model=Plugin)
async def get_plugin(
    plugin_name: str,
    plugins: AgnosticCollection = Depends(plugin_repo.collection),
):
    """
    Get a plugin by name.
    """
    plugin = await plugins.find_one({"name": plugin_name})
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin


@router.put("/api/plugins/{plugin_name}", response_model=Plugin)
async def update_plugin(
    plugin_name: str,
    plugin: Plugin,
    plugins: AgnosticCollection = Depends(plugin_repo.collection),
):
    """
    Update a plugin by name.
    """
    plugin = await plugins.find_one_and_update(
        {"name": plugin_name},
        {"$set": plugin.dict(by_alias=True, exclude_unset=True)},
        return_document=True,
    )
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin


@router.delete("/api/plugins/{plugin_name}")
async def delete_plugin(
    plugin_name: str,
    plugins: AgnosticCollection = Depends(plugin_repo.collection),
):
    """
    Delete a plugin by name.
    """
    plugin = await plugins.find_one_and_delete({"name": plugin_name}, {"_id": 0})
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin
