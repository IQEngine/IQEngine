import datetime
from typing import Optional
import os

from azure.storage.blob import BlobProperties, BlobSasPermissions, generate_blob_sas
from azure.storage.blob.aio import BlobClient, ContainerClient
from .models import Metadata
from helpers.urlmapping import ApiType, get_file_name
from pydantic import SecretStr
from helpers.samples import get_spectrogram_image

# IQEngine-oriented wrappers around the Azure BlobClient class.
class AzureBlobClient:
    account: str
    container: str
    sas_token: SecretStr = None
    account_key: SecretStr = None
    base_filepath: str = None # only used for local

    def __init__(self, account, container):
        self.account = account
        self.container = container
        self.clients: dict[str, BlobClient] = {}
        if account == "local":
            self.base_filepath = os.getenv("IQENGINE_BACKEND_LOCAL_FILEPATH", None)
            self.base_filepath = self.base_filepath.replace('"','')
            if not self.base_filepath:
                raise Exception("IQENGINE_BACKEND_LOCAL_FILEPATH must be set to use local")

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
        # make sure that sp contains w and c and they need to be in this
        # part of the query string not in the & that follows
        content = self.sas_token.get_secret_value().split("&")[0]
        if "w" in content and "c" in content:
            return True
        return False

    def can_write(self):
        return self.account_key or self.sas_token_has_write_permission()

    def get_blob_client(self, filepath):
        if filepath in self.clients:
            return self.clients[filepath]
        if self.account == "local":
            return None
        elif self.account_key:
            sas_token = self.generate_sas_token(
                filepath, self.account_key.get_secret_value(), True
            )
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
        if self.account == "local":
            return None
        elif not self.sas_token:
            return ContainerClient.from_container_url(
                f"https://{self.account}.blob.core.windows.net/{self.container}"
            )
        return ContainerClient.from_container_url(
            f"https://{self.account}.blob.core.windows.net/{self.container}",
            credential=self.sas_token.get_secret_value(),
        )

    async def get_blob_content(
        self, filepath: str, offset: Optional[int] = None, length: Optional[int] = None
    ) -> bytes:
        if self.account == "local":
            if '..' in filepath:
                raise Exception("Invalid filepath")
            with open(os.path.join(self.base_filepath, filepath), "rb") as f:
                f.seek(offset)
                return f.read(length)
        blob_client = self.get_blob_client(filepath)
        blob = await blob_client.download_blob(offset=offset, length=length)
        content = await blob.readall()
        return content

    async def get_blob_stream(
        self, filepath: str, offset: Optional[int] = None, length: Optional[int] = None
    ):
        if self.account == "local":
            if '..' in filepath:
                raise Exception("Invalid filepath")
            f = open(os.path.join(self.base_filepath, filepath), "rb")
            if offset:
                f.seek(offset)
            return f # TODO: this leads to the download being pretty slow because it feeds it byte by byte
        blob_client = self.get_blob_client(filepath)
        blob = await blob_client.download_blob(offset=offset, length=length) # returns type StorageStreamDownloader, an Azure class, we use its chunks() method which returns Iterator[bytes]
        return blob.chunks()

    async def upload_blob(self, filepath: str, data: bytes):
        if self.account == "local":
            print("Cannot upload to local") # making this a raise() was causing delay
            return
        blob_client = self.get_blob_client(filepath)
        await blob_client.upload_blob(data, overwrite=True)

    async def get_new_thumbnail(self, data_type: str, filepath: str) -> bytes:
        iq_path = get_file_name(filepath, ApiType.IQDATA)
        fftSize = 1024
        content = await self.get_blob_content(iq_path, 8000, fftSize * 512)
        return get_spectrogram_image(content, data_type, fftSize)

    async def get_metadata_files(self):
        # For local files
        if self.account == "local":
            for path, subdirs, files in os.walk(self.base_filepath):
                for name in files:
                    if name.endswith(".sigmf-meta"):
                        metadata = await self.get_metadata_file(os.path.join(path, name))
                        yield os.path.join(path, name).replace(self.base_filepath, '')[1:], metadata
            return

        # Azure blobs
        container_client = self.get_container_client()
        # files that end with .sigmf-meta
        async for blob in container_client.list_blobs():
            if blob.name.endswith(".sigmf-meta"):
                try:
                    metadata = await self.get_metadata_file(blob.name)
                    yield str(blob.name), metadata
                except Exception as e:
                    print(f"Error while reading metadata file {blob.name}: {e}")
        return

    async def get_metadata_file(self, filepath: str):
        if self.account == "local":
            if '..' in filepath:
                raise Exception("Invalid filepath")
            with open(filepath, "r") as f:
                content = f.read()
        else:
            blob_client = self.get_blob_client(filepath)
            blob = await blob_client.download_blob()
            content = await blob.readall()
        return Metadata.parse_raw(content)

    async def blob_exist(self, filepath):
        if self.account == "local":
            return os.path.isfile(os.path.join(self.base_filepath, filepath)) 
        blob_client = self.get_blob_client(filepath)
        return await blob_client.exists()

    async def get_file_length(self, filepath):
        if self.account == "local":
            return os.path.getsize(os.path.join(self.base_filepath, filepath))
        blob_client = self.get_blob_client(filepath)
        blob = await blob_client.get_blob_properties()
        return int(blob.size)

    def generate_sas_token(
        self, filepath: str, account_key: str, include_write: bool = False
    ):
        if self.account == "local":
            return None
        start_time = datetime.datetime.now(datetime.timezone.utc)
        expiry_time = start_time + datetime.timedelta(hours=1)
        try:
            sas_token = generate_blob_sas(
                account_name=self.account,
                container_name=self.container,
                blob_name=filepath,
                account_key=account_key,
                permission=BlobSasPermissions(
                    read=True, write=include_write, create=include_write, add=include_write
                ),
                expiry=expiry_time,
                start=start_time,
            )
        except Exception as e:
            raise Exception(f"Error generating SAS token: {e}")
        return sas_token
