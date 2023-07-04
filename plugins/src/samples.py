import asyncio
import base64
import io

import numpy as np
from azure.storage.blob import BlobClient
from models.plugins import Plugin, SamplesB64, SamplesCloud

data_mapping = {
    "iq/ci8_le": np.int8,
    "iq/ci16_le": np.int16,
    "iq/cf32_le": np.float32,
}


def get_blob(account_name, container_name, file_path, sas_token):
    if not sas_token:
        return BlobClient.from_blob_url(
            f"https://{account_name}.blob.core.windows.net/{container_name}/{file_path}.sigmf-data",
        )
    return BlobClient.from_blob_url(
        f"https://{account_name}.blob.core.windows.net/{container_name}/{file_path}.sigmf-data",
        credential=sas_token,
    )


def get_custom_params(plugin: Plugin, samples: SamplesB64 | SamplesCloud):
    custom_params = plugin.custom_params
    custom_params["sample_rate"] = samples.sample_rate
    custom_params["center_freq"] = samples.center_freq
    return custom_params


def get_from_samples_b64(samples_b64: SamplesB64):
    return np.frombuffer(
        base64.decodebytes(samples_b64.samples.encode()), dtype=np.complex64
    )


async def get_from_samples_cloud(samples_cloud: SamplesCloud) -> np.ndarray:
    blob_client = get_blob(
        samples_cloud.account_name,
        samples_cloud.container_name,
        samples_cloud.file_path,
        samples_cloud.sas_token,
    )

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
    buffer = get_float32_buffer(buffer)

    return buffer.view(dtype=np.complex64)


def get_float32_buffer(buffer: np.ndarray):
    if buffer.dtype == np.int16:
        return buffer.astype(np.float32) / np.iinfo("int16").max
    if buffer.dtype == np.int8:
        return buffer.astype(np.float32) / np.iinfo("int8").max
    return buffer


def validate_samples(samples_b64: SamplesB64, samples_cloud: SamplesCloud):
    if samples_b64 and samples_cloud:
        raise ValueError("Only one of samples_b64 or samples_cloud can be specified")
    if not samples_b64 and not samples_cloud:
        raise ValueError("One of samples_b64 or samples_cloud must be specified")


def convert_to_complex_64(buffer: np.ndarray):
    return buffer.view(dtype=np.complex64)
