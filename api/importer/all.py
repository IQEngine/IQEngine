from importer.plugins import import_plugins_from_env


async def import_all_from_env():
    await import_plugins_from_env()
