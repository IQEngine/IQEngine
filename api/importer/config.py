import json
import os
import copy

from database.models import Configuration
from database.config_repo import get
from database.config_repo import collection


def import_default_config_from_env():
    try:
        configuration = get()
        updated_configuration = copy.deepcopy(configuration)

        if updated_configuration is None:
            updated_configuration = Configuration()

        feature_flags = os.getenv("IQENGINE_FEATURE_FLAGS", None)
        if updated_configuration.feature_flags is None and feature_flags: 
            updated_configuration.feature_flags = json.loads(feature_flags)

        if(configuration is None):
            collection().insert_one(updated_configuration.dict(by_alias=True, exclude_unset=True))
        elif(get().feature_flags is None):
            collection().update_one({}, {"$set": updated_configuration.dict(by_alias=True, exclude_unset=True)})

    except Exception as e:
        # throw a custom plugin failed to load exception
        raise Exception(
            f"Failed to load config from environment variables",
            e,
        )
