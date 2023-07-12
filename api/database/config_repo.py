from database.database import db
from database.models import Configuration
from pymongo.collection import Collection


def collection() -> Configuration:
    collection: Collection[Configuration] = db().configuration
    return collection


def get() -> Configuration | None:
    current = db().configuration.find_one()
    if current is None:
        return None
    return Configuration(**current)


def exists() -> bool:
    return get() is not None
