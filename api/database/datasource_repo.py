from database.database import db
from database.models import DataSource
from motor.core import AgnosticCollection


def collection() -> AgnosticCollection:
    collection: AgnosticCollection = db().datasources
    return collection


async def get(account, container) -> DataSource:
    """
    Get a datasource by account and container

    Parameters
    ----------
    account : str
        The account name.
    container : str
        The container name.

    Returns
    -------
    DataSource
        The datasource.
    """

    datasource_collection: AgnosticCollection = collection()
    datasource = await datasource_collection.find_one(
        {"account": account, "container": container}
    )
    if datasource is None:
        return None
    return DataSource(**datasource)


async def datasource_exists(account, container) -> bool:
    """
    Check if a datasource exists by account and container

    Parameters
    ----------
    account : str
        The account name.
    container : str
        The container name.

    Returns
    -------
    bool
        True if the datasource exists, False otherwise.
    """
    return await get(account, container) is not None
