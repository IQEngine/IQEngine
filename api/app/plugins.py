import json
import os
from .database import db
from .models import Plugin


async def get(name) -> Plugin:
    plugins_collection = db().plugins
    plugin = await plugins_collection.find_one({"name": name})
    if not plugin:
        return None
    return Plugin(**plugin)


# Import plugins from environment variable, clears the collection first
async def import_plugins_from_env(environment_variable_name="IQENGINE_PLUGINS"):
    try:
        plugins_json = os.getenv(environment_variable_name, None)
        if not plugins_json:
            return None
        plugins_collection = db().plugins
        await plugins_collection.delete_many({})  # clears the plugins db
        for plugin in json.loads(plugins_json):  # list of dicts
            await plugins_collection.insert_one(plugin)
    except Exception as e:
        raise Exception(f"Failed to load plugins from environment variable {environment_variable_name}", e)
