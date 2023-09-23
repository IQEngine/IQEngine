from .database import db
from .models import Configuration
from motor.core import AgnosticCollection


def collection() -> AgnosticCollection:
    collection: AgnosticCollection = db().configuration
    return collection


async def get() -> Configuration | None:
    current = await collection().find_one()
    if current is None:
        return None
    return Configuration(**current)


async def exists() -> bool:
    return (await get()) is not None
