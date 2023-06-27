import database.database
from database.models import Plugin
from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection

router = APIRouter()


@router.post("/api/plugins", status_code=201, response_model=Plugin)
def create_plugin(
    plugin: Plugin,
    plugins: Collection[Plugin] = Depends(database.database.plugins_collection),
):
    """
    Create a new plugin. The plugin will be henceforth identified by name which
    must be unique or this function will return a 400.
    """
    if plugins.find_one({"name": plugin.name}):
        raise HTTPException(status_code=409, detail="plugin Already Exists")

    plugins.insert_one(plugin.dict(by_alias=True, exclude_unset=True))
    return plugin


@router.get("/api/plugins", response_model=list[Plugin])
def get_plugins(
    plugins: Collection[Plugin] = Depends(database.database.plugins_collection),
):
    """
    Get a list of all plugins.
    """
    return list(plugins.find({}))


@router.get("/api/plugins/{plugin_name}", response_model=Plugin)
def get_plugin(
    plugin_name: str,
    plugins: Collection[Plugin] = Depends(database.database.plugins_collection),
):
    """
    Get a plugin by name.
    """
    plugin = plugins.find_one({"name": plugin_name})
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin


@router.put("/api/plugins/{plugin_name}", response_model=Plugin)
def update_plugin(
    plugin_name: str,
    plugin: Plugin,
    plugins: Collection[Plugin] = Depends(database.database.plugins_collection),
):
    """
    Update a plugin by name.
    """
    plugin = plugins.find_one_and_update(
        {"name": plugin_name},
        {"$set": plugin.dict(by_alias=True, exclude_unset=True)},
        return_document=True,
    )
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin


@router.delete("/api/plugins/{plugin_name}")
def delete_plugin(
    plugin_name: str,
    plugins: Collection[Plugin] = Depends(database.database.plugins_collection),
):
    """
    Delete a plugin by name.
    """
    plugin = plugins.find_one_and_delete({"name": plugin_name}, {"_id": 0})
    if plugin is None:
        raise HTTPException(status_code=404, detail="plugin Not Found")
    return plugin
