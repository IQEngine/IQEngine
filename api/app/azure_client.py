import datetime
import os
from typing import Optional

import aioboto3
import boto3
from azure.storage.blob import BlobSasPermissions, generate_blob_sas
from azure.storage.blob.aio import BlobClient, ContainerClient
from botocore.exceptions import ClientError
from helpers.samples import get_spectrogram_image
from helpers.urlmapping import ApiType, get_file_name
from pydantic import SecretStr


# IQEngine-oriented wrappers around the Azure BlobClient class.
class AzureBlobClient:
    account: str
    container: str
    awsAccessKeyId: str = None  # AWS S3 only
    sas_token: SecretStr = None
    account_key: SecretStr = None
    awsSecretAccessKey: SecretStr = None  # AWS S3 only
    base_filepath: str = None  # only used for local

    def __init__(self, account, container, awsAccessKeyId):
        self.account = account
        self.container = container
        self.awsAccessKeyId = awsAccessKeyId
        self.clients: dict[str, BlobClient] = {}
        if account == "local":
            self.base_filepath = os.getenv("IQENGINE_BACKEND_LOCAL_FILEPATH", None)
            self.base_filepath = self.base_filepath.replace('"', "")
            if not self.base_filepath:
                raise Exception("IQENGINE_BACKEND_LOCAL_FILEPATH must be set to use local")

    def set_sas_token(self, sas_token):
        self.sas_token = sas_token

    def set_account_key(self, account_key):
        self.account_key = account_key

    def set_aws_secret_access_key(self, aws_secret_access_key):
        self.awsSecretAccessKey = aws_secret_access_key

    def sas_token_has_write_permission(self):
        if not self.sas_token:
            return False
        if not self.sas_token.get_secret_value():
            return False
        if self.sas_token.get_secret_value() == "":
            return False
        if self.awsSecretAccessKey:
            return True  # AWS S3 creds is assumed to have write permission
        content = self.sas_token.get_secret_value().split("&")[0]
        if "w" in content and "c" in content:
            return True
        return False

    def can_write(self):
        return self.account_key or self.sas_token_has_write_permission()

    def get_blob_client(self, filepath):
        if filepath in self.clients:
            return self.clients[filepath]
        elif self.account == "local":
            return None
        elif self.awsAccessKeyId:
            return None
        # Azure Blob (every case below)
        elif self.account_key:
            sas_token = self.generate_sas_token(filepath, self.account_key.get_secret_value(), True)
            blob_client = BlobClient.from_blob_url(
                f"https://{self.account}.blob.core.windows.net/" f"{self.container}/{filepath}",
                credential=sas_token,
            )
        elif not self.sas_token:
            blob_client = BlobClient.from_blob_url(f"https://{self.account}.blob.core.windows.net/" f"{self.container}/{filepath}")
        else:
            blob_client = BlobClient.from_blob_url(
                f"https://{self.account}.blob.core.windows.net/" f"{self.container}/{filepath}",
                credential=self.sas_token.get_secret_value(),
            )
        self.clients[filepath] = blob_client
        return blob_client

    async def close_blob_clients(self):
        for client in self.clients.values():
            await client.close()

    def get_container_client(self):
        if self.account == "local":
            return None
        elif self.awsAccessKeyId:
            return None
        elif not self.sas_token:
            return ContainerClient.from_container_url(f"https://{self.account}.blob.core.windows.net/{self.container}")
        return ContainerClient.from_container_url(
            f"https://{self.account}.blob.core.windows.net/{self.container}",
            credential=self.sas_token.get_secret_value(),
        )

    async def get_blob_content(self, filepath: str, offset: Optional[int] = None, length: Optional[int] = None) -> bytes:
        if self.account == "local":
            if ".." in filepath:
                raise Exception("Invalid filepath")
            with open(os.path.join(self.base_filepath, filepath), "rb") as f:
                f.seek(offset)
                return f.read(length)
        elif self.awsAccessKeyId:  # S3
            session = aioboto3.Session()
            async with session.client(
                "s3",
                aws_access_key_id=self.awsAccessKeyId,
                aws_secret_access_key=self.awsSecretAccessKey.get_secret_value(),
                region_name=self.account,
            ) as s3_client:
                if length is not None and offset is not None:
                    byte_range = f"bytes={offset}-{offset + length - 1}"
                    obj = await s3_client.get_object(Bucket=self.container, Key=filepath, Range=byte_range)
                else:
                    obj = await s3_client.get_object(Bucket=self.container, Key=filepath)
                return await obj["Body"].read()
        else:  # Azure blob
            blob_client = self.get_blob_client(filepath)
            blob = await blob_client.download_blob(offset=offset, length=length)
            return await blob.readall()

    async def get_blob_stream(self, filepath: str, offset: Optional[int] = None, length: Optional[int] = None):
        if self.account == "local":
            if ".." in filepath:
                raise Exception("Invalid filepath")
            f = open(os.path.join(self.base_filepath, filepath), "rb")
            if offset:
                f.seek(offset)
            return f  # TODO: this leads to the download being pretty slow because it feeds it byte by byte
        if self.awsAccessKeyId:  # S3
            session = aioboto3.Session()
            s3_client = await session.client(
                "s3",
                aws_access_key_id=self.awsAccessKeyId,
                aws_secret_access_key=self.awsSecretAccessKey.get_secret_value(),
                region_name=self.account,
            ).__aenter__()
            try:
                if length is not None and offset is not None:
                    byte_range = f"bytes={offset}-{offset + length - 1}"
                    obj = await s3_client.get_object(Bucket=self.container, Key=filepath, Range=byte_range)
                else:
                    obj = await s3_client.get_object(Bucket=self.container, Key=filepath)
                return obj["Body"]
            except Exception as e:
                await s3_client.__aexit__(type(e), e, e.__traceback__)
                raise
        else:
            blob_client = self.get_blob_client(filepath)
            # returns type StorageStreamDownloader, an Azure class, we use its chunks() method which returns Iterator[bytes]
            blob = await blob_client.download_blob(offset=offset, length=length)
            return blob.chunks()

    async def upload_blob(self, filepath: str, data: bytes):
        if self.account == "local":
            # print("Cannot upload to local") # making this a raise() was causing delay
            return
        if self.awsAccessKeyId:  # S3
            print("Cannot upload to S3 yet")
            return
        blob_client = self.get_blob_client(filepath)
        await blob_client.upload_blob(data, overwrite=True)

    async def get_new_thumbnail(self, data_type: str, filepath: str) -> bytes:
        iq_path = get_file_name(filepath, ApiType.IQDATA)
        fftSize = 512
        # sort of arbitrary, want to avoid weird stuff that happens at the beginning of signal, must be an integer multiple of 16!!
        skip_bytes = 256000
        # it's not going to be 1024 rows, for f32 its 128 rows and for int16 its 256 rows
        content = await self.get_blob_content(iq_path, skip_bytes, fftSize * 1024)
        return get_spectrogram_image(content, data_type, fftSize)

    async def blob_exist(self, filepath):
        if self.account == "local":
            return os.path.isfile(os.path.join(self.base_filepath, filepath))
        elif self.awsAccessKeyId:  # S3
            session = aioboto3.Session()
            async with session.client(
                "s3",
                aws_access_key_id=self.awsAccessKeyId,
                aws_secret_access_key=self.awsSecretAccessKey.get_secret_value(),
                region_name=self.account,
            ) as s3_client:
                try:
                    await s3_client.head_object(Bucket=self.container, Key=filepath)
                    return True
                except ClientError as e:
                    if e.response["Error"]["Code"] == "404":
                        return False
        else:  # Azure blob
            blob_client = self.get_blob_client(filepath)
            return await blob_client.exists()

    async def get_file_length(self, filepath):
        if self.account == "local":
            return os.path.getsize(os.path.join(self.base_filepath, filepath))
        elif self.awsAccessKeyId:  # S3
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=self.awsAccessKeyId,
                aws_secret_access_key=self.awsSecretAccessKey.get_secret_value(),
                region_name=self.account,
            )
            response = s3_client.head_object(Bucket=self.container, Key=filepath)
            return response["ContentLength"]
        else:
            blob_client = self.get_blob_client(filepath)
            blob = await blob_client.get_blob_properties()
            return int(blob.size)

    def generate_sas_token(self, filepath: str, account_key: str, include_write: bool = False):
        if self.account == "local":
            return None
        elif self.awsAccessKeyId:  # S3
            return None
        start_time = datetime.datetime.now(datetime.timezone.utc)
        expiry_time = start_time + datetime.timedelta(hours=1)
        try:
            sas_token = generate_blob_sas(
                account_name=self.account,
                container_name=self.container,
                blob_name=filepath,
                account_key=account_key,
                permission=BlobSasPermissions(read=True, write=include_write, create=include_write, add=include_write),
                expiry=expiry_time,
                start=start_time,
            )
        except Exception as e:
            raise Exception(f"Error generating SAS token: {e}")
        return sas_token
