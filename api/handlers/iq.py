import asyncio
import base64
import io
import json
import logging
from typing import List
from fastapi.responses import StreamingResponse

import numpy as np
from rf.samples import get_dtype, get_multiplier, get_samples

from blob.azure_client import AzureBlobClient
from database import datasource_repo
from database.models import DataSource
from fastapi import APIRouter, Depends, HTTPException
from helpers.cipher import decrypt
from helpers.urlmapping import ApiType, get_file_name
from pydantic import BaseModel, SecretStr

router = APIRouter()


class IQData(BaseModel):
    indexes: List[int]
    tile_size: int
    bytes_per_sample: int


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
    "/api/datasources/{account}/{container}/{filepath:path}/iq-data",
    status_code=200
)
async def get_iq_data(
    filepath: str,
    fft_start: int,
    fft_step: int,
    fft_size: int,
    num_ffts: int,
    format: str,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
):
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    try:
        return StreamingResponse(
            get_byte_stream(num_ffts, fft_start, fft_step, fft_size, get_multiplier(format), get_file_name(filepath, ApiType.IQDATA), azure_client)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

async def get_byte_stream(num_ffts, fft_start, fft_step, fft_size, multiplier, iq_file, azure_client):
    for i in range(num_ffts):
        offsetBytes = (fft_start + i * fft_step * fft_size) * multiplier
        countBytes = fft_size * multiplier

        content = await azure_client.get_blob_content(
            filepath=iq_file, offset=offsetBytes, length=countBytes
        )

        yield content

@router.get(
    "/api/datasources/{account}/{container}/{filepath:path}/iqslice", status_code=200
)
async def get_iq(
    filepath: str,
    offsetBytes: int,
    countBytes: int,
    datasource: DataSource = Depends(datasource_repo.get),
    azure_client: AzureBlobClient = Depends(AzureBlobClient),
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
    bytes_per_sample: int,
    blob_size: int,
):
    offsetBytes = index * tile_size * bytes_per_sample * 2
    countBytes = tile_size * bytes_per_sample * 2
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
                iq_data.bytes_per_sample,
                blob_size,
            )
            for index in iq_data.indexes
        ]
        data_list = await asyncio.gather(*tasks)

        return data_list

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
