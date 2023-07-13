import json
import os

from database import plugin_repo


async def import_plugins_from_env(environment_variable_name="IQENGINE_PLUGINS"):
    """
    Import plugins from environment variable
    Will not import if plugin already exists
    """
    try:
        plugins_json = os.getenv(environment_variable_name, None)
        if not plugins_json:
            return None
        plugins = json.loads(plugins_json)

        client = plugin_repo.collection()
        for plugin in plugins:
            if await client.find_one({"name": plugin["name"]}, {"_id": 1}):
                continue
            await client.insert_one(plugin)
    except Exception as e:
        # throw a custom plugin failed to load exception
        raise Exception(
            f"Failed to load plugins from environment variable {environment_variable_name}",
            e,
        )
