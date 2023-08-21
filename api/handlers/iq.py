import asyncio
import io
import math
from typing import List

from blob.azure_client import AzureBlobClient
from database import datasource_repo
from database.models import DataSource
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from helpers.apidisconnect import CancelOnDisconnectRoute, cancel_on_disconnect
from helpers.cipher import decrypt
from helpers.conversions import find_smallest_and_largest_next_to_each_other
from helpers.datasource_access import check_access
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
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")
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

    tasks = [
        get_byte_stream_wrapper(block_index_chunk)
        for block_index_chunk in block_indexes_chunks
    ]
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

    return content


@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}.sigmf-data",
    response_class=StreamingResponse,
)
async def get_iqfile(
    filepath: str,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
    access_allowed=Depends(check_access),
):
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")

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
    "/api/datasources/{account}/{container}/{filepath:path}/minimap-data",
    status_code=200,
)
async def get_minimap_iq(
    request: Request,
    filepath: str,
    format: str,
    access_allowed=Depends(check_access),
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
):
    fft_size = 64
    if access_allowed is None:
        raise HTTPException(status_code=403, detail="No Access")
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    try:
        if datasource.sasToken:
            azure_client.set_sas_token(decrypt(datasource.sasToken.get_secret_value()))
        if datasource.account_key:
            azure_client.set_account_key(
                decrypt(datasource.account_key.get_secret_value())
            )
        minimap_iq_file = get_file_name(filepath, ApiType.MINIMAP)
        if await azure_client.blob_exist(minimap_iq_file):
            blob = await azure_client.get_blob_content(filepath=minimap_iq_file)
            return Response(content=blob, media_type="application/octet-stream")
        else:
            file_name = get_file_name(filepath, ApiType.IQDATA)
            bytes_per_sample = get_bytes_per_iq_sample(format)
            blob_data_properties = await azure_client.get_blob_properties(file_name)
            blob_size = blob_data_properties.size
            total_ffts = math.floor(blob_size / (bytes_per_sample * fft_size))
            # get 1000 ffts equally spaced out
            block_indexes = [math.floor(i * total_ffts / 1000) for i in range(1000)]
            # make sure that no block index it is larger than the total number of ffts
            block_indexes = [i for i in block_indexes if i < total_ffts]
            data = calculate_iq_data(
                block_indexes,
                fft_size,  # default minimap fft size
                get_bytes_per_iq_sample(format),
                file_name,
                azure_client,
                request,
            )

            content = io.BytesIO()
            async for chunk in data:
                content.write(chunk)
            content.seek(0)
            if azure_client.can_write():
                await azure_client.upload_blob(
                    filepath=minimap_iq_file, data=content.getvalue()
                )
            else:
                print("Cannot write minimap to blob")
            content.seek(0)
            return Response(
                content=content.getvalue(),
                media_type="application/octet-stream",
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
