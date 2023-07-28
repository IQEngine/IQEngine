from importer.config import import_default_config_from_env
from importer.datasource import import_datasources_from_env
from importer.plugins import import_plugins_from_env


async def import_all_from_env():
    try:
        await import_plugins_from_env()
        await import_default_config_from_env()
        await import_datasources_from_env()
    except Exception as e:
        print("Failed to import all from env", e)
        return None
