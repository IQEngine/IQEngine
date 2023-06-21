import io
import base64
import logging
import asyncio
import database.database
from database.models import DataSource
from pymongo.collection import Collection
from azure.storage.blob import BlobClient
from fastapi import HTTPException, Depends, APIRouter
from typing import List
from pydantic import BaseModel

from asyncio import to_thread
from .cipher import decrypt


router = APIRouter()


class IQData(BaseModel):
    indexes: List[int]
    tile_size: int
    bytes_per_sample: int


def get_sas_token(
    account: str,
    container: str,
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):

    datasource = datasources_collection.find_one(
        {"account": account, "container": container}
    )
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    if "sasToken" in datasource:
        decrypted_sas_token = decrypt(datasource["sasToken"])
    else:
        return None
    if not decrypted_sas_token:
        return None
    return decrypted_sas_token


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/iqslice", status_code=200
)
def get_iq(
    account: str,
    container: str,
    filepath: str,
    offsetBytes: int,
    countBytes: int,
    sasToken: str = Depends(get_sas_token),
):

    try:
        if not sasToken:
            raise HTTPException(status_code=400, detail="Invalid SAS token")

        blob_client = BlobClient.from_blob_url(
            f"https://{account}.blob.core.windows.net/"
            f"{container}/{filepath}.sigmf-data",
            credential=sasToken,
        )

        download_stream = blob_client.download_blob(offsetBytes, countBytes)
        data = io.BytesIO(download_stream.readall())
        encoded_data = base64.b64encode(data.getvalue()).decode("utf-8")
        return {"data": encoded_data}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def download_blob(blob_client, index, tile_size, bytes_per_sample, blob_size):
    offsetBytes = index * tile_size * bytes_per_sample * 2
    countBytes = tile_size * bytes_per_sample * 2
    if (offsetBytes + countBytes) > blob_size:
        countBytes = blob_size - offsetBytes
    download_stream = await to_thread(
        blob_client.download_blob, offsetBytes, countBytes
    )
    data = io.BytesIO(download_stream.readall())
    encoded_data = base64.b64encode(data.getvalue()).decode("utf-8")
    return {"index": index, "data": encoded_data}


@router.post(
    "/api/datasources/{account}/{container}/{filepath:path}/iqslices", status_code=200
)
async def get_iq_data_slices(
    iq_data: IQData,
    account: str,
    container: str,
    filepath: str,
    sasToken: str = Depends(get_sas_token),
):
    try:
        logger = logging.getLogger("api")
        logger.info(f"tile_size: {iq_data.tile_size}")

        if not sasToken:
            raise HTTPException(status_code=400, detail="Invalid SAS token")

        blob_client = BlobClient.from_blob_url(
            f"https://{account}.blob.core.windows.net/{container}/{filepath}.sigmf-data",
            credential=sasToken,
        )
        blob_properties = blob_client.get_blob_properties()
        blob_size = blob_properties.size

        data_list = []

        # asyncio solution. Much faster
        tasks = [
            download_blob(
                blob_client,
                index,
                iq_data.tile_size,
                iq_data.bytes_per_sample,
                blob_size,
            )
            for index in iq_data.indexes
        ]
        data_list = await asyncio.gather(*tasks)

        return data_list

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
