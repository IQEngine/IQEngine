from typing import Optional
import json
import os
import time
import random
import asyncio
import numpy as np
from fastapi import Depends
from pymongo.operations import ReplaceOne

from .azure_client import AzureBlobClient
from .models import DataSource
from helpers.cipher import decrypt, encrypt
from motor.core import AgnosticCollection
from helpers.samples import get_bytes_per_iq_sample
from .models import DataSource
from helpers.datasource_access import check_access
from .database import db
from .metadata import validate_metadata

def collection() -> AgnosticCollection:
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
        print(f"[SYNC] Datasource {account}/{container} does not exist")  # dont raise exception or it will cause unclosed connection errors
        return
    if datasource.sasToken:
        azure_blob_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))

    #######################################
    # Reading and Parsing Local Metafiles #
    #######################################
    if azure_blob_client.account == "local":
        metadatas = []
        for path, subdirs, files in os.walk(azure_blob_client.base_filepath):
            for name in files:
                if name.endswith(".sigmf-meta"):
                    filepath = os.path.join(path, name)
                    if '..' in filepath:
                        raise Exception("Invalid filepath")
                    with open(filepath, "r") as f:
                        content = f.read()
                    try:
                        metadata = json.loads(content)
                        metadata = validate_metadata(metadata)
                    except Exception as e:
                        # this will give specific reasons parsing failed, it eventually needs to get put in a log or something
                        print(f"[SYNC] Error parsing metadata file {filepath}: {e}")
                        continue
                    if metadata:
                        metadatas.append((os.path.join(path, name).replace(azure_blob_client.base_filepath, '')[1:], metadata))
        # Even though the below code is similar to Azure version, the Azure version had to be tweaked to parallelize it
        for metadata in metadatas:
            filepath = metadata[0].replace(".sigmf-meta", "")  # TODO: clean up the tuple messiness
            try:
                if not await azure_blob_client.blob_exist(filepath + ".sigmf-data"):
                    print(f"[SYNC] Data file {filepath} does not exist for metadata file")
                    continue
                metadata = metadata[1]
                metadata["global"]["traceability:origin"] = {
                    "type": "api",
                    "account": account,
                    "container": container,
                    "file_path": filepath,
                }
                metadata["global"]["traceability:revision"] = 0
                file_length = await azure_blob_client.get_file_length(filepath + ".sigmf-data")
                metadata["global"]["traceability:sample_length"] = (
                    file_length / get_bytes_per_iq_sample(metadata["global"]["core:datatype"])
                )
                await create(metadata, user=None)  # creates or updates the metadata object
                # print(f"[SYNC] Created metadata for {filepath}") # commented out, caused too much spam
            except Exception as e:
                print(f"[SYNC] Error creating metadata for {filepath}: {e}")

    else:
        ###################################################
        # Reading and Parsing Azure Metafiles in Parallel #
        ###################################################
        container_client = azure_blob_client.get_container_client()
        blobs = container_client.list_blobs(include=["metadata"])  # cant use list_blob_names because we also need data file length
        meta_blob_names = []
        data_blob_sizes = {}  # holds the names and sizes of sigmf-data files
        start_t = time.time()
        async for blob in blobs:
            if blob.name.endswith(".sigmf-meta"):
                meta_blob_names.append(blob.name)
            elif blob.name.endswith(".sigmf-data"):
                data_blob_sizes[blob.name] = blob.size
        print("[SYNC] getting list of metas took", time.time() - start_t, "seconds")  # 30s for MIT
        print("[SYNC] found", len(meta_blob_names), "meta files")  # the process above took about 15s for 36318 metas

        async def get_metadata(meta_blob_name):
            if not meta_blob_name.replace(".sigmf-meta", ".sigmf-data") in data_blob_sizes:  # bail early if data file doesnt exist
                print(f"[SYNC] Data file for {meta_blob_name} wasn't found")
                return None
            blob_client = container_client.get_blob_client(meta_blob_name)
            blob = await blob_client.download_blob()  # takes 0.04s on avg per call, on occasion ~1s
            # print(time.time())
            content = await blob.readall()
            try:
                metadata = json.loads(content)
                metadata = validate_metadata(metadata)
            except Exception as e:
                # this will give specific reasons parsing failed, it eventually needs to get put in a log or something
                print(f"[SYNC] Error parsing metadata file {meta_blob_name}: {e}")
                return None
            if metadata:
                filepath = meta_blob_name.replace(".sigmf-meta", "")
                # add traceability:origin
                metadata["global"]["traceability:origin"] = {
                    "type": "api",
                    "account": account,
                    "container": container,
                    "file_path": filepath,
                }
                metadata["global"]["traceability:revision"] = 0
                file_length = data_blob_sizes[filepath + ".sigmf-data"]
                bytes_per_iq_sample = get_bytes_per_iq_sample(metadata["global"]["core:datatype"])
                metadata["global"]["traceability:sample_length"] = (file_length / bytes_per_iq_sample)
                return metadata

        # Running all coroutines at once failed for datasets with 10k's metas, so we need to break it up into batches
        start_t = time.time()
        batch_size = 1000  # manually tweaked, above 1000 it doesnt seem to speed up by much
        num_batches = int(np.ceil(len(meta_blob_names) / batch_size))
        metadatas = []
        for i in range(num_batches):
            coroutines = []
            for meta_blob_name in meta_blob_names[i * batch_size:(i + 1) * batch_size]:
                coroutines.append(get_metadata(meta_blob_name))
            ret = await asyncio.gather(*coroutines)  # Wait for all the coroutines to finish
            metadatas.extend([x for x in ret if x is not None])  # remove the Nones
        print("[SYNC] getting and parsing all metas took", time.time() - start_t, "seconds")

        if Depends(check_access) is None:
            return False

        bulk_writes = []
        for metadata in metadatas:
            filter = {
                "global.traceability:origin.account": account,
                "global.traceability:origin.container": container,
                "global.traceability:origin.file_path": metadata['global']['traceability:origin']['file_path'],
            }
            bulk_writes.append(ReplaceOne(filter=filter, replacement=metadata, upsert=True))
        metadata_collection = db().metadata
        metadata_collection.bulk_write(bulk_writes)

        ''' At some point we may remove the versions thing
        # audit document
        audit_document = {
            "metadata": metadata,
            "user": None,
            "action": "create",
        }
        versions: AgnosticCollection = versions_collection()
        await versions.insert_one(audit_document)
        '''

    print(f"[SYNC] Finished syncing {account}/{container}")
    await azure_blob_client.close_blob_clients()  # Close all the blob clients to avoid unclosed connection errors

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
    base_filepath = base_filepath.replace('"', '') if base_filepath else None

    # Add another random delay for good measure, we kept having ones start really close together
    time.sleep(random.randint(0, 10000) / 1000)  # 0-10 seconds, to greatly reduce risk of duplicates

    # Clear the metadata db
    metadata_collection = db().metadata
    await metadata_collection.delete_many({})  # clears the metadata db

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
                    accountKey=connection["accountKey"] if "accountKey" in connection else None,
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
