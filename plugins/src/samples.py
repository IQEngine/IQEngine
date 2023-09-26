import asyncio
import io

import numpy as np
from azure.storage.blob import BlobClient
from models.plugins import SamplesCloud

data_mapping = {
    "iq/ci8": np.int8,
    "iq/ci8_le": np.int8,
    "iq/ci16": np.int16,
    "iq/ci16_le": np.int16,
    "iq/ci32": np.int32,
    "iq/ci32_le": np.int32,
    "iq/cf16": np.float16,
    "iq/cf16_le": np.float16,
    "iq/cf32": np.float32,
    "iq/cf32_le": np.float32,
}


async def get_from_samples_cloud(samples_cloud: SamplesCloud) -> np.ndarray:
    blob_url = f"https://{samples_cloud.account_name}.blob.core.windows.net/{samples_cloud.container_name}/{samples_cloud.file_path}.sigmf-data"
    if not samples_cloud.sas_token:
        blob_client = BlobClient.from_blob_url(blob_url)
    else:
        blob_client = BlobClient.from_blob_url(blob_url, credential=samples_cloud.sas_token)

    if samples_cloud.byte_length:
        download_stream = await asyncio.to_thread(
            blob_client.download_blob,
            samples_cloud.byte_offset,
            samples_cloud.byte_length,
        )
    else:
        # TODO: This is timing out, we need to find an asychronus way of
        # processing the file without blocking a successful response
        download_stream = await asyncio.to_thread(blob_client.download_blob)

    buffer = np.frombuffer(
        io.BytesIO(download_stream.readall()).read(),
        dtype=data_mapping[samples_cloud.data_type],
    )

    if buffer.dtype == np.int16:
        buffer = buffer.astype(np.float32) / np.iinfo("int16").max
    elif buffer.dtype == np.int8:
        buffer = buffer.astype(np.float32) / np.iinfo("int8").max
    
    return buffer.view(dtype=np.complex64)
