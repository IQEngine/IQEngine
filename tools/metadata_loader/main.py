import argparse
import json
import os
from urllib.parse import quote

import requests
from azure.storage.blob import (  # pyright: ignore[reportMissingImports]
    BlobServiceClient,
)
from dotenv import load_dotenv

load_dotenv()


def get_config():
    return {
        "API_URL_BASE": os.getenv("API_URL_BASE"),
        "BLOB_STORAGE_ACCOUNT_URL": os.getenv("BLOB_STORAGE_ACCOUNT_URL"),
        "BLOB_STORAGE_SAS_KEY": os.getenv("BLOB_STORAGE_SAS_KEY"),
    }


def call_get_datasources_api(url):
    return requests.get(url, timeout=15)


def get_datasources(args):
    config = get_config()

    url = f'{config["API_URL_BASE"]}/api/datasources'
    resp = call_get_datasources_api(url)

    print(resp.text)

    return resp.text


def call_create_datasource_api(url, payload):
    return requests.post(url, json=payload, timeout=5)


def create_datasource(args):
    config = get_config()

    url = f'{config["API_URL_BASE"]}/api/datasources'
    data = {
        "type": f"{args.type}",
        "name": f"{args.name}",
        "account": f"{args.accountName}",
        "container": f"{args.containerName}",
        "description": f"{args.description}",
        "sasToken": f"{args.sasToken}",
    }
    resp = call_create_datasource_api(url, payload=data)

    return resp.text


def call_get_all_metadata_api(url: str):
    return requests.get(url, timeout=15)


def get_all_meta(args):
    config = get_config()

    url = (
        f'{config["API_URL_BASE"]}/api/datasources/'
        f"{args.accountName}/{args.containerName}/meta"
    )
    resp = call_get_all_metadata_api(url)

    items = json.loads(resp.text)
    if len(items) == 0:
        print(
            f"There are no items in account: {args.accountName}"
            f", container: {args.containerName}."
        )
    else:
        for item in items:
            print(
                f"Account: {item['accountName']}, Container: {item['containerName']}"
                f", filepath: {item['filepath']}"
            )

    return resp.text


def call_create_meta_api(url, payload):
    return requests.post(url, json=payload, timeout=30)


def create_meta(accountName: str, containerName: str, filepath: str, document: str):
    config = get_config()

    quoted_filepath = quote(filepath, safe="")
    url = (
        f'{config["API_URL_BASE"]}/api/datasources/{accountName}'
        f"/{containerName}/{quoted_filepath}/meta"
    )
    resp = call_create_meta_api(url, payload=document)
    return resp.status_code


def initial_load_meta(args):
    config = get_config()

    storage_url = config["BLOB_STORAGE_ACCOUNT_URL"]
    storage_sas = config["BLOB_STORAGE_SAS_KEY"]
    blob_service_client = BlobServiceClient(
        account_url=storage_url, credential=storage_sas
    )
    container_client = blob_service_client.get_container_client(
        container=args.containerName
    )

    blob_list = container_client.list_blobs()
    blob_names = [x.name for x in blob_list]

    overall_response = True
    for blob_name in blob_names:
        basename = os.path.basename(blob_name)

        parts = basename.split(".")
        ext_index = len(parts) - 1

        if len(parts) < 2 or parts[ext_index] != "sigmf-meta":
            continue

        dirname = os.path.dirname(blob_name)
        filename_base = ".".join(parts[0:ext_index])
        filepath = f"{dirname}/{filename_base}"

        if f"{filepath}.sigmf-data" not in blob_names:
            print(f"Skipping file {basename} because there is no sigmf-data.")
            continue

        blob_client = container_client.get_blob_client(blob=blob_name)
        downloader = blob_client.download_blob(max_concurrency=1, encoding="UTF-8")
        blob_text = downloader.readall()

        resp = create_meta(
            args.accountName, args.containerName, filepath, json.loads(blob_text)
        )

        print(f"Load of {basename} into the database {'succeeded' if resp==201 else 'failed'}.")

        overall_response = overall_response and resp == 201

    return overall_response


def start():
    """
    commands
    python main.py ...
        datasource add -name -accountName -containerName -description
        datasource list
        metadata list
        metadata addfolder -accountName -containerName -document
    """
    parser = argparse.ArgumentParser(description="Metadata database tools.")
    subparsers = parser.add_subparsers()

    datasource_parser = subparsers.add_parser("datasource")
    datasource_subparsers = datasource_parser.add_subparsers()

    datasource_create_parser = datasource_subparsers.add_parser(
        "create", description="Create a datasource"
    )
    datasource_create_parser.add_argument("-type", required=True)
    datasource_create_parser.add_argument("-name", required=True)
    datasource_create_parser.add_argument("-accountName", required=True)
    datasource_create_parser.add_argument("-containerName", required=True)
    datasource_create_parser.add_argument("-description", required=True)
    datasource_create_parser.add_argument("-sasToken")
    datasource_create_parser.set_defaults(func=create_datasource)

    datasource_list_parser = datasource_subparsers.add_parser(
        "list", description="List all datasources"
    )
    datasource_list_parser.set_defaults(func=get_datasources)

    metadata_parser = subparsers.add_parser("metadata")
    metadata_subparsers = metadata_parser.add_subparsers()

    metadata_list_parser = metadata_subparsers.add_parser("list")
    metadata_list_parser.add_argument("-accountName", required=True)
    metadata_list_parser.add_argument("-containerName", required=True)
    metadata_list_parser.set_defaults(func=get_all_meta)

    metadata_addfolder_parser = metadata_subparsers.add_parser("addfolder")
    metadata_addfolder_parser.add_argument("-accountName")
    metadata_addfolder_parser.add_argument("-containerName")
    metadata_addfolder_parser.set_defaults(func=initial_load_meta)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    start()
