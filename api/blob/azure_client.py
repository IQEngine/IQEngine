import datetime
from typing import Optional

from azure.storage.blob import BlobProperties, BlobSasPermissions, generate_blob_sas
from azure.storage.blob.aio import BlobClient, ContainerClient
from database.models import Metadata
from helpers.urlmapping import ApiType, get_file_name
from pydantic import SecretStr
from rf.spectrogram import get_spectrogram_image


class AzureBlobClient:
    """
    AzureBlobClient is a wrapper around the Azure BlobClient class.


    Parameters
    ----------
    account : str
        The Azure account name.
    container : str
        The Azure container name.
    """

    account: str
    container: str
    sas_token: SecretStr = None
    account_key: SecretStr = None
    clients: dict[str, BlobClient] = {}

    def __init__(self, account, container):
        self.account = account
        self.container = container

    def set_sas_token(self, sas_token):
        self.sas_token = sas_token

    def set_account_key(self, account_key):
        self.account_key = account_key

    def sas_token_has_write_permission(self):
        if not self.sas_token:
            return False
        if not self.sas_token.get_secret_value():
            return False
        if self.sas_token.get_secret_value() == "":
            return False
        # make sure that sp contains w and c and they need to be in this part of the query string not in the & that follows
        content = self.sas_token.get_secret_value().split("&")[0]
        if "w" in content and "c" in content:
            return True
        return False

    def can_write(self):
        return self.account_key or self.sas_token_has_write_permission()
    

    def get_blob_client(self, filepath):
        if filepath in self.clients:
            return self.clients[filepath]
        if self.account_key:
            sas_token = self.generate_sas_token(filepath, self.account_key.get_secret_value(), True)
            blob_client = BlobClient.from_blob_url(
                f"https://{self.account}.blob.core.windows.net/"
                f"{self.container}/{filepath}",
                credential=sas_token,
            )
        elif not self.sas_token:
            blob_client = BlobClient.from_blob_url(
                f"https://{self.account}.blob.core.windows.net/"
                f"{self.container}/{filepath}"
            )
        else:
            blob_client = BlobClient.from_blob_url(
                f"https://{self.account}.blob.core.windows.net/"
                f"{self.container}/{filepath}",
                credential=self.sas_token.get_secret_value(),
            )
        self.clients[filepath] = blob_client
        return blob_client

    def get_container_client(self):
        if not self.sas_token:
            return ContainerClient.from_container_url(
                f"https://{self.account}.blob.core.windows.net/{self.container}"
            )
        return ContainerClient.from_container_url(
            f"https://{self.account}.blob.core.windows.net/{self.container}",
            credential=self.sas_token.get_secret_value(),
        )

    async def get_blob_properties(self, filepath) -> BlobProperties:
        blob_client = self.get_blob_client(filepath)
        return await blob_client.get_blob_properties()

    async def get_blob_content(
        self, filepath: str, offset: Optional[int] = None, length: Optional[int] = None
    ) -> bytes:
        blob_client = self.get_blob_client(filepath)
        blob = await blob_client.download_blob(offset=offset, length=length)
        content = await blob.readall()
        return content

    async def get_blob_stream(
        self, filepath: str, offset: Optional[int] = None, length: Optional[int] = None
    ):
        blob_client = self.get_blob_client(filepath)
        blob = await blob_client.download_blob(offset=offset, length=length)
        return blob

    async def upload_blob(self, filepath: str, data: bytes):
        blob_client = self.get_blob_client(filepath)
        await blob_client.upload_blob(data, overwrite=True)

    async def get_new_thumbnail(self, data_type: str, filepath: str) -> bytes:
        iq_path = get_file_name(filepath, ApiType.IQDATA)
        fftSize = 1024
        content = await self.get_blob_content(iq_path, 8000, fftSize * 512)
        image = get_spectrogram_image(content, data_type, fftSize)
        return image

    async def get_metadata_files(self):
        container_client = self.get_container_client()
        # files that enf with .sigmf-meta
        async for blob in container_client.list_blobs():
            if blob.name.endswith(".sigmf-meta"):
                try:
                    metadata = await self.get_metadata_file(blob.name)
                    yield str(blob.name), metadata
                except Exception as e:
                    print(f"Error while reading metadata file {blob.name}: {e}")
        return

    async def get_metadata_file(self, filepath: str):
        blob_client = self.get_blob_client(filepath)
        blob = await blob_client.download_blob()
        content = await blob.readall()
        metadata = Metadata.parse_raw(content)
        return metadata

    async def blob_exist(self, filepath):
        blob_client = self.get_blob_client(filepath)
        return await blob_client.exists()

    async def get_file_length(self, filepath):
        blob_client = self.get_blob_client(filepath)
        blob = await blob_client.get_blob_properties()
        return int(blob.size)

    def generate_sas_token(self, filepath: str, account_key: str, include_write: bool = False):
        start_time = datetime.datetime.now(datetime.timezone.utc)
        expiry_time = start_time + datetime.timedelta(hours=1)
        try:
            sas_token = generate_blob_sas(
                account_name=self.account,
                container_name=self.container,
                blob_name=filepath,
                account_key=account_key,
                permission=BlobSasPermissions(read=True, write=include_write, create=include_write),
                expiry=expiry_time,
                start=start_time,
            )
        except Exception as e:
            raise Exception(f"Error generating SAS token: {e}")
        return sas_token
