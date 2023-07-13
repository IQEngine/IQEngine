import copy
import json
import os

from database.config_repo import collection, get
from database.models import Configuration


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
            collection().insert_one(
                updated_configuration.dict(by_alias=True, exclude_unset=True)
            )
        elif configuration.feature_flags is None:
            collection().update_one(
                {},
                {"$set": updated_configuration.dict(by_alias=True, exclude_unset=True)},
            )

    except Exception as e:
        # throw a custom plugin failed to load exception
        raise Exception(
            "Failed to load config from environment variables",
            e,
        )
