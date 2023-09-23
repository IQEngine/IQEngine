from typing import Optional

from blob.azure_client import AzureBlobClient
from database.models import DataSource, DataSourceReference
from helpers.cipher import decrypt, encrypt
from motor.core import AgnosticCollection
from rf.samples import get_bytes_per_iq_sample


def collection() -> AgnosticCollection:
    from database.database import db

    collection: AgnosticCollection = db().datasources
    return collection


async def get(account, container) -> DataSource | None:
    # Get a datasource by account and container
    datasource_collection: AgnosticCollection = collection()
    datasource = await datasource_collection.find_one(
        {"account": account, "container": container}
    )
    if datasource is None:
        return None
    return DataSource(**datasource)


async def datasource_exists(account, container) -> bool:
    # Check if a datasource exists by account and container
    return await get(account, container) is not None


async def sync(account: str, container: str):
    import database.metadata_repo

    azure_blob_client = AzureBlobClient(account, container)
    datasource = await get(account, container)
    if datasource is None:
        raise Exception(f"[SYNC] Datasource {account}/{container} does not exist")
    if datasource.sasToken:
        azure_blob_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))
    metadatas = azure_blob_client.get_metadata_files()
    async for metadata in metadatas:
        filepath = metadata[0].replace(".sigmf-meta", "")
        try:
            if await database.metadata_repo.exists(account, container, filepath):
                print(f"[SYNC] Metadata already exists for {filepath}")
                continue
            if not await azure_blob_client.blob_exist(filepath + ".sigmf-data"):
                print(f"[SYNC] Data file {filepath} does not exist for metadata file")
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
            file_length = await azure_blob_client.get_file_length(
                filepath + ".sigmf-data"
            )
            metadata.globalMetadata.traceability_sample_length = (
                file_length
                / get_bytes_per_iq_sample(metadata.globalMetadata.core_datatype)
            )
            await database.metadata_repo.create(metadata, user=None)
            print(f"[SYNC] Created metadata for {filepath}")
        except Exception as e:
            print(f"[SYNC] Error creating metadata for {filepath}: {e}")
    print(f"[SYNC] Finished syncing {account}/{container}")


async def create(datasource: DataSource, user: Optional[dict]) -> DataSource:
    """
    Create a new datasource. The datasource will be henceforth identified by account/container which
    must be unique or this function will return a 400.
    This will encrypt the sasToken if it is provided.
    """
    datasource_collection: AgnosticCollection = collection()
    if await datasource_exists(datasource.account, datasource.container):
        raise Exception("Datasource Already Exists")
    if datasource.sasToken:
        datasource.sasToken = encrypt(datasource.sasToken)
    else:
        datasource.sasToken = ""
    if datasource.accountKey:
        datasource.accountKey = encrypt(datasource.accountKey)
    else:
        datasource.accountKey = ""
    datasource_dict = datasource.dict(by_alias=True, exclude_unset=True)

    if "owners" not in datasource_dict:
        datasource_dict["owners"] = []
    if user and user["preferred_username"]:
        datasource_dict["owners"].append(user["preferred_username"])
    if "readers" not in datasource_dict:
        datasource_dict["readers"] = []
    if "public" not in datasource_dict:
        datasource_dict["public"] = True
    await datasource_collection.insert_one(datasource_dict)
    return datasource
