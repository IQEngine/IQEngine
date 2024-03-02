from .database import db
from .models import Configuration
import json
import os

async def get() -> Configuration | None:
    configuration_collection = db().configuration
    # even if there are multiple entries (eg due to multiple workers adding them at the same time), they should all match
    current = await configuration_collection.find_one()
    if current is None:
        return None
    return Configuration(**current)

async def exists() -> bool:
    return (await get()) is not None

# Create the config entry after clearing the collection
async def import_default_config_from_env():
    try:
        configuration_collection = db().configuration
        await configuration_collection.delete_many({})  # clears the configuration db
        configuration = Configuration()  # empty shell for a config
        feature_flags = os.getenv("IQENGINE_FEATURE_FLAGS", None)
        if feature_flags:
            configuration.feature_flags = json.loads(feature_flags)
        await configuration_collection.insert_one(configuration.dict(by_alias=True, exclude_unset=True))

    except Exception as e:
        raise Exception("Failed to load config from environment variables", e)
