from .datasource import import_datasources_from_env
from .plugins import import_plugins_from_env
import copy
import json
import os

from .config_repo import collection, get
from .models import Configuration

async def import_default_config_from_env():
    try:
        configuration = await get()
        updated_configuration = copy.deepcopy(configuration)

        if updated_configuration is None:
            updated_configuration = Configuration()

        feature_flags = os.getenv("IQENGINE_FEATURE_FLAGS", None)
        if updated_configuration.feature_flags is None and feature_flags:
            updated_configuration.feature_flags = json.loads(feature_flags)

        if configuration is None:
            await collection().insert_one(
                updated_configuration.dict(by_alias=True, exclude_unset=True)
            )
        elif configuration.feature_flags is None:
            await collection().update_one(
                {},
                {"$set": updated_configuration.dict(by_alias=True, exclude_unset=True)},
            )

    except Exception as e:
        # throw a custom plugin failed to load exception
        raise Exception(
            "Failed to load config from environment variables",
            e,
        )


async def import_all_from_env():
    try:
        await import_plugins_from_env()
        await import_default_config_from_env()
        await import_datasources_from_env()
    except Exception as e:
        print("Failed to import all from env", e)
        return None
