import os
import requests
import argparse
import json
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient
from urllib.parse import quote

# given the datasource details
# given the folder
# enumerate the files in the folder
# for each one
#     read the file
#     call the create meta api

def get_config():
    load_dotenv()
    return {
        "API_URL_BASE": os.environ.get("API_URL_BASE"),
        "STORAGE_ACCOUNT_URL": os.environ.get("STORAGE_ACCOUNT_URL"),
        "STORAGE_CONNECTION_STRING": os.environ.get("STORAGE_CONNECTION_STRING"),
        "STORAGE_SAS_KEY": os.environ.get("STORAGE_SAS_KEY")
    }


def get_datasources():
    url = f'{config["API_URL_BASE"]}/api/datasources'
    resp = requests.get(url)
    print(resp.text)


def create_datasource(name: str, accountName: str, containerName: str, description: str):
    url = f'{config["API_URL_BASE"]}/api/datasources'
    data = {
        "name": f'{name}',
        "accountName": f'{accountName}',
        "containerName": f'{containerName}',
        "description": f'{description}'
    }
    resp = requests.post(url, json=data)
    print(resp.text)


def create_meta(datasource_id: str, filepath: str, document: str):
    
    quoted_filepath = quote(filepath, safe='')
    url = f'{config["API_URL_BASE"]}/api/datasources/{datasource_id}/{quoted_filepath}/meta'
    resp = requests.post(url, json=document)
    print(resp.text)


def get_all_meta(datasource_id: str):
    url = f'{config["API_URL_BASE"]}/api/datasources/{datasource_id}/meta'
    resp = requests.get(url)
    print(resp.text)


def initial_load_meta(containerName: str, datasource_id: str):

    storage_url = config["STORAGE_ACCOUNT_URL"]
    storage_sas = config["STORAGE_SAS_KEY"]
    blob_service_client = BlobServiceClient(account_url=storage_url, credential=storage_sas)
    container_client = blob_service_client.get_container_client(container=containerName)

    blob_list = container_client.list_blobs()
    for blob in blob_list:
        
        print(blob.name)
        # if blob.name == "/dir1/dir2/abc.sigmf-meta"
        # then basename = abc.sigmf-meta, dirname = /dir1/dir2

        basename = os.path.basename(blob.name)
        parts = basename.split('.')
        if parts[1] != 'sigmf-meta':
            continue

        blob_client = container_client.get_blob_client(blob=blob.name)
        downloader = blob_client.download_blob(max_concurrency=1, encoding='UTF-8')
        blob_text = downloader.readall()

        dirname = os.path.dirname(blob.name)
        filepath = f"{dirname}/{parts[0]}"

        create_meta(datasource_id, filepath, blob_text)

        break


def start():
    #create_datasource(name="greg", accountName="golivemisc", containerName="sigmf-metadata", description="greg's metadata")
    #get_datasources()
    initial_load_meta("sigmf-metadata", "646d9e2163713d4671dccdac")
    get_all_meta(datasource_id="646d9e2163713d4671dccdac")
    pass


if __name__ == "__main__":
    config = get_config()
    start()
