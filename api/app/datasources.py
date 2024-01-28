from typing import Optional
import json
import os
import time
import random

from .azure_client import AzureBlobClient
from .models import DataSource, DataSourceReference
from helpers.cipher import decrypt, encrypt
from motor.core import AgnosticCollection
from helpers.samples import get_bytes_per_iq_sample
from .models import DataSource

def collection() -> AgnosticCollection:
    from .database import db
    collection: AgnosticCollection = db().datasources
    return collection

async def get(account, container) -> DataSource | None:
    # Get a datasource by account and container
    datasource_collection: AgnosticCollection = collection()
    datasource = await datasource_collection.find_one({"account": account, "container": container})
    if datasource is None:
        return None
    return DataSource(**datasource)

async def datasource_exists(account, container) -> bool:
    return await get(account, container) is not None

async def sync(account: str, container: str):
    from .metadata import create

    print(f"[SYNC] Starting sync for {account}/{container} on PID {os.getpid()} at {time.time()}")
    azure_blob_client = AzureBlobClient(account, container)
    datasource = await get(account, container)
    if datasource is None:
        print(f"[SYNC] Datasource {account}/{container} does not exist") # dont raise exception or it will cause unclosed connection errors
        return
    if datasource.sasToken:
        azure_blob_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))
    metadatas = azure_blob_client.get_metadata_files() # this includes parsing of all the metadata
    async for metadata in metadatas:
        filepath = metadata[0].replace(".sigmf-meta", "")
        try:
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
            file_length = await azure_blob_client.get_file_length(filepath + ".sigmf-data")
            metadata.globalMetadata.traceability_sample_length = (
                file_length / get_bytes_per_iq_sample(metadata.globalMetadata.core_datatype)
            )
            await create(metadata, user=None) # creates or updates the metadata object
            #print(f"[SYNC] Created metadata for {filepath}") # commented out, caused too much spam
        except Exception as e:
            print(f"[SYNC] Error creating metadata for {filepath}: {e}")

    print(f"[SYNC] Finished syncing {account}/{container}")

async def create_datasource(datasource: DataSource, user: Optional[dict]) -> DataSource:
    """
    Create a new datasource. The datasource will be henceforth identified by account/container which
    must be unique or this function will return a 400.
    This will encrypt the sasToken if it is provided.
    """
    datasource_collection: AgnosticCollection = collection()
    if await datasource_exists(datasource.account, datasource.container):
        print("Datasource Already Exists!")
        return None
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

async def import_datasources_from_env():
    connection_info = os.getenv("IQENGINE_CONNECTION_INFO", None)
    base_filepath = os.getenv("IQENGINE_BACKEND_LOCAL_FILEPATH", None)
    base_filepath = base_filepath.replace('"','') if base_filepath else None

    # Add another random delay for good measure, we kept having ones start really close together
    time.sleep(random.randint(0, 10000) / 1000) # 0-10 seconds, to greatly reduce risk of duplicates

    # Add datasource corresponding to the local backend storage
    if base_filepath and os.path.exists(base_filepath):
        try:
            if not await datasource_exists('local', 'local'):
                datasource = DataSource(
                    account='local',
                    container='local',
                    sasToken=None,
                    accountKey=None,
                    name="Local to Backend",
                    description="Files stored on the backend server in the " + str(base_filepath) + " directory",
                    imageURL="https://raw.githubusercontent.com/IQEngine/IQEngine/main/client/public/backend-storage.svg",
                    type="api",
                    public=True,
                    owners=["IQEngine-Admin"],
                    readers=[],
                )
                # Check one more time that it doesn't exist yet (the above block can take 0.1s or more)
                if not await datasource_exists('local', 'local'):
                    create_ret = await create_datasource(datasource=datasource, user=None)
                    if create_ret:
                        await sync("local", "local")
        except Exception as e:
            print(f"Failed to import datasource local to backend", e)

    # Add all cloud datasources
    if connection_info:
        for connection in json.loads(connection_info).get("settings", []):
            try:
                if await datasource_exists(connection["accountName"], connection["containerName"]):
                    continue
                datasource = DataSource(
                    account=connection["accountName"],
                    container=connection["containerName"],
                    sasToken=connection["sasToken"],
                    accountKey=connection["accountKey"]  if "accountKey" in connection else None,
                    name=connection["name"],
                    description=connection["description"]
                    if "description" in connection
                    else None,
                    imageURL=connection["imageURL"] if "imageURL" in connection else None,
                    type="api",
                    public=connection["public"] if "public" in connection else True,
                    owners=connection["owners"] if "owners" in connection else ["IQEngine-Admin"],
                    readers=connection["readers"] if "readers" in connection else [],
                )
                # Check one more time that it doesn't exist yet (the above block can take 0.1s or more)
                if await datasource_exists(connection["accountName"], connection["containerName"]):
                    continue
                # It's important to immediately add it to the db so other workers see it and dont add a duplicate
                create_ret = await create_datasource(datasource=datasource, user=None)
                # This should only get triggered once (one worker)
                if create_ret:
                    await sync(connection["accountName"], connection["containerName"])
            except Exception as e:
                print(f"Failed to import datasource {connection['name']}", e)
                continue
