from importer.config import import_default_config_from_env
from importer.plugins import import_plugins_from_env


async def import_all_from_env():
    await import_plugins_from_env()
    await import_default_config_from_env()
