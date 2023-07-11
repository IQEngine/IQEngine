from database.database import db
from database.models import DataSource
from pymongo.collection import Collection


def collection() -> Collection[DataSource]:
    collection: Collection[DataSource] = db().datasources
    return collection


def get(account, container) -> DataSource:
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

    datasource = collection().find_one({"account": account, "container": container})
    if datasource is None:
        return None
    return DataSource(**datasource)


def datasource_exists(account, container) -> bool:
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
    return get(account, container) is not None
