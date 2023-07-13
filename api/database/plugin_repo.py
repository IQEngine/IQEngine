from database.database import db
from database.models import Plugin
from motor.core import AgnosticCollection


def collection() -> AgnosticCollection:
    collection: AgnosticCollection = db().plugins
    return collection


async def get(name) -> Plugin:
    plugin = await collection().find_one({"name": name})
    if not plugin:
        return None
    return Plugin(**plugin)
