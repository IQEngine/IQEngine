from azure.storage.blob import BlobClient

class AzureBlobClient():

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
    
    def does_blob_exist(self, filepath):
        blob_client = self.get_blob_client(filepath)
        return blob_client.exists()