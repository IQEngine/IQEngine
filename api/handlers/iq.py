import asyncio
import base64
import io
import logging
import time
from typing import List, Optional

from blob.azure_client import AzureBlobClient
from database import datasource_repo
from database.models import DataSource
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from helpers.apidisconnect import cancel_on_disconnect, CancelOnDisconnectRoute
from helpers.authorization import required_roles
from helpers.cipher import decrypt
from helpers.conversions import find_smallest_and_largest_next_to_each_other
from helpers.urlmapping import ApiType, get_content_type, get_file_name
from pydantic import BaseModel, SecretStr
from rf.samples import get_bytes_per_iq_sample

router = APIRouter(route_class=CancelOnDisconnectRoute)


class IQData(BaseModel):
    indexes: List[int]
    tile_size: int
    bytes_per_iq_sample: int


async def get_sas_token(
    datasource: DataSource = Depends(datasource_repo.get),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    if "sasToken" in datasource and datasource["sasToken"] != "":
        decrypted_sas_token = decrypt(datasource["sasToken"])
        return decrypted_sas_token
    else:
        return SecretStr("")


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/iq-data", status_code=200
)
@cancel_on_disconnect
async def get_iq_data(
    request: Request,
    filepath: str,
    block_indexes_str: str,
    block_size: int,
    format: str,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    if hasattr(datasource, "sasToken"):
        if datasource.sasToken:
            azure_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))

    try:
        block_indexes = [int(num) for num in block_indexes_str.split(",")]

        return StreamingResponse(
            calculate_iq_data(
                block_indexes,
                block_size,
                get_bytes_per_iq_sample(format),
                get_file_name(filepath, ApiType.IQDATA),
                azure_client,
                request,
            ),
            media_type="application/octet-stream",
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def calculate_iq_data(
    block_indexes,
    block_size,
    format,
    iq_file,
    azure_client,
    request,
):
    iq_data_list = await get_byte_streams(
        block_indexes,
        block_size,
        format,
        iq_file,
        azure_client,
        request,
    )
    for iq_data in iq_data_list:
        yield iq_data


async def get_byte_streams(
    block_indexes, block_size, bytes_per_iq_sample, iq_file, azure_client, request
):

    max_concurrent_requests = 100
    chunk_size = 100 * 1024 // block_size
    block_indexes_arrs = find_smallest_and_largest_next_to_each_other(block_indexes)

    block_indexes_chunks = []
    for i in block_indexes_arrs:
        if i[1] - i[0] > chunk_size:
            indexes = [
                [j, min(j + chunk_size - 1, i[1])]
                for j in range(i[0], i[1] + 1, chunk_size)
            ]
            block_indexes_chunks.extend(indexes)
        else:
            block_indexes_chunks.append(i)

    blob_size = await azure_client.get_file_length(iq_file)

    semaphore = asyncio.Semaphore(max_concurrent_requests)

    async def get_byte_stream_wrapper(block_index_chunk):
        async with semaphore:
            return await get_byte_stream(
                request,
                block_index_chunk,
                block_size,
                bytes_per_iq_sample,
                iq_file,
                azure_client,
                blob_size,
            )

    tasks = [get_byte_stream_wrapper(block_index_chunk) for block_index_chunk in block_indexes_chunks]
    return await asyncio.gather(*tasks)


async def get_byte_stream(
    request,
    block_indexes_chunk,
    block_size,
    bytes_per_iq_sample,
    iq_file,
    azure_client,
    blob_size,
):
    st = time.time()

    offsetBytes = block_indexes_chunk[0] * block_size * bytes_per_iq_sample
    countBytes = (
        (block_indexes_chunk[1] - block_indexes_chunk[0] + 1)
        * block_size
        * bytes_per_iq_sample
    )

    if blob_size < offsetBytes:
        return b""
    if blob_size < offsetBytes + countBytes:
        countBytes = blob_size - offsetBytes
    content = await azure_client.get_blob_content(
        filepath=iq_file, offset=offsetBytes, length=countBytes
    )

    #print(f"get_byte_stream: {time.time() - st}")

    return content


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}.sigmf-data",
    response_class=StreamingResponse,
)
async def get_iqfile(
    filepath: str,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
    current_user: Optional[dict] = Depends(required_roles()),
):
    # Create the imageURL with sasToken
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")

    azure_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))
    content_type = get_content_type(ApiType.IQDATA)
    iq_path = get_file_name(filepath, ApiType.IQDATA)
    if not azure_client.blob_exist(iq_path):
        raise HTTPException(status_code=404, detail="File not found")

    response = await azure_client.get_blob_stream(iq_path)
    return StreamingResponse(response.chunks(), media_type=content_type)


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/iqslice",
    status_code=200,
)
async def get_iq(
    filepath: str,
    offsetBytes: int,
    countBytes: int,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
    current_user: Optional[dict] = Depends(required_roles()),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    try:
        azure_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))
        iq_file = get_file_name(filepath, ApiType.IQDATA)
        blob = await azure_client.get_blob_content(
            filepath=iq_file, offset=offsetBytes, length=countBytes
        )
        data = io.BytesIO(blob)
        encoded_data = base64.b64encode(data.getvalue()).decode("utf-8")
        return {"data": encoded_data}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def download_blob(
    azure_client: AzureBlobClient,
    filepath: str,
    index: int,
    tile_size: int,
    bytes_per_iq_sample: int,
    blob_size: int,
):
    offsetBytes = index * tile_size * bytes_per_iq_sample
    countBytes = tile_size * bytes_per_iq_sample
    if (offsetBytes + countBytes) > blob_size:
        countBytes = blob_size - offsetBytes
    blob = await azure_client.get_blob_content(
        filepath=filepath, offset=offsetBytes, length=countBytes
    )
    data = io.BytesIO(blob)
    encoded_data = base64.b64encode(data.getvalue()).decode("utf-8")
    return {"index": index, "data": encoded_data}


@router.post(
    "/api/datasources/{account}/{container}/{filepath:path}/iqslices", status_code=200
)
async def get_iq_data_slices(
    iq_data: IQData,
    filepath: str,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
    current_user: Optional[dict] = Depends(required_roles()),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    try:
        azure_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))
        logger = logging.getLogger("api")
        logger.info(f"tile_size: {iq_data.tile_size}")
        iq_file = get_file_name(filepath, ApiType.IQDATA)
        blob_properties = await azure_client.get_blob_properties(iq_file)
        blob_size = blob_properties.size

        data_list = []

        # asyncio solution. Much faster
        tasks = [
            download_blob(
                azure_client,
                iq_file,
                index,
                iq_data.tile_size,
                iq_data.bytes_per_iq_sample,
                blob_size,
            )
            for index in iq_data.indexes
        ]
        data_list = await asyncio.gather(*tasks)

        return data_list

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
