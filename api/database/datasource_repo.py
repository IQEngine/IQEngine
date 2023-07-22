import database.metadata_repo
from blob.azure_client import AzureBlobClient
from database.database import db
from database.models import DataSource, DataSourceReference
from helpers.cipher import decrypt
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


async def sync(account: str, container: str):
    azure_blob_client = AzureBlobClient(account, container)
    datasource = await get(account, container)
    if datasource is None:
        raise Exception(f"Datasource {account}/{container} does not exist")
    azure_blob_client.set_sas_token(decrypt(datasource.sasToken))
    metadatas = azure_blob_client.get_medatada_files()
    async for metadata in metadatas:
        filepath = metadata[0].replace(".sigmf-meta", "")
        metadata = metadata[1]
        metadata.globalMetadata.traceability_origin = DataSourceReference(
            **{
                "type": "api",
                "account": account,
                "container": container,
                "file_path": filepath,
            }
        )
        metadata.globalMetadata.traceability_revision = 0
        if await database.metadata_repo.exists(account, container, filepath):
            continue
        await database.metadata_repo.create(account, container, filepath)
