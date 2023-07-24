from database.database import db
from database.models import DataSource
from helpers.cipher import encrypt
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


async def create(datasource: DataSource) -> DataSource:
    """
    Create a new datasource. The datasource will be henceforth identified by account/container which
    must be unique or this function will return a 400.
    This will encrypt the sasToken if it is provided.

    Parameters
    ----------
    datasource : DataSource
        The datasource to create.

    Returns
    -------
    DataSource
        The datasource.
    """
    datasource_collection: AgnosticCollection = collection()
    if await datasource_exists(datasource.account, datasource.container):
        raise Exception("Datasource Already Exists")
    if datasource.sasToken:
        datasource.sasToken = encrypt(datasource.sasToken)
    else:
        datasource.sasToken = ""
    datasource_dict = datasource.dict(by_alias=True, exclude_unset=True)
    await datasource_collection.insert_one(datasource_dict)
    return datasource
