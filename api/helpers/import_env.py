from app.datasources import import_datasources_from_env
from app.plugins import import_plugins_from_env
from app.config import import_default_config_from_env

# For whatever reason we cant define the 3 above in this file or else the mocks fail

async def import_all_from_env():
    try:
        await import_plugins_from_env()
        await import_default_config_from_env()
        await import_datasources_from_env()
    except Exception as e:
        print("Failed to import all from env", e)
        return None
