import database.metadata_repo
from blob.azure_client import AzureBlobClient
from database.database import db
from database.models import DataSource, DataSourceReference
from helpers.cipher import decrypt, encrypt
from motor.core import AgnosticCollection
from rf.samples import get_sample_length_from_byte_lenth


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
    metadatas = azure_blob_client.get_metadata_files()
    async for metadata in metadatas:
        filepath = metadata[0].replace(".sigmf-meta", "")
        if not azure_blob_client.blob_exist(filepath + ".sigmf-data"):
            print(f"Data file {filepath} does not exist for metadata file")
            continue
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
        file_length = await azure_blob_client.get_file_length(filepath + ".sigmf-data")
        metadata.globalMetadata.traceability_sample_length = (
            get_sample_length_from_byte_lenth(
                file_length, metadata.globalMetadata.core_datatype
            )
        )
        if await database.metadata_repo.exists(account, container, filepath):
            continue
        await database.metadata_repo.create(account, container, filepath)


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
