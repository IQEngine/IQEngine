from azure.storage.blob import BlobClient, BlobProperties
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

    def __init__(self, account, container):
        self.account = account
        self.container = container

    def set_sas_token(self, sas_token):
        self.sas_token = sas_token

    def get_blob_client(self, filepath):
        if not self.sas_token:
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
        return blob_client

    def blob_exist(self, filepath):
        blob_client = self.get_blob_client(filepath)
        return blob_client.exists()

    def get_blob_properties(self, filepath) -> BlobProperties:
        blob_client = self.get_blob_client(filepath)
        return blob_client.get_blob_properties()

    def get_blob_content(
        self, filepath: str, offset: int = None, length: int = None
    ) -> bytes:
        blob_client = self.get_blob_client(filepath)
        return blob_client.download_blob(offset=offset, length=length).readall()

    def upload_blob(self, filepath: str, data: bytes):
        blob_client = self.get_blob_client(filepath)
        blob_client.upload_blob(data, overwrite=True)

    def get_new_thumbnail(self, data_type: str, filepath: str) -> bytes:
        iq_path = get_file_name(filepath, ApiType.IQDATA)
        fftSize = 1024
        content = self.get_blob_content(iq_path, 8000, fftSize * 512)
        image = get_spectrogram_image(content, data_type, fftSize)
        return image
