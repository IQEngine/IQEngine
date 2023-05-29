import sys
from argparse import Namespace
from unittest import TestCase
from unittest.mock import patch

sys.path.insert(0, "../metadata_loader")
from metadata_loader.main import (  # noqa E402
    create_meta,
    get_all_meta,
    initial_load_meta,
)


def mock_request_get(*args, **kwargs):
    class MockResponse:
        def __init__(self, text):
            self.text = text

        def text(self):
            return self.text

    return MockResponse("[]")


def mock_request_post(*args, **kwargs):
    class MockResponse:
        def __init__(self, text):
            self.text = text

        def text(self):
            return self.text

    return MockResponse("Success")


mock_config = {
    "API_URL_BASE": "https://some.where.io",
    "STORAGE_ACCOUNT_URL": "https://acct.blob.core.windows.net",
    "STORAGE_SAS_KEY": "xyzzy",
}


class blob:
    def __init__(self, name):
        self.name = name

    def name(self):
        return self.name


mock_blobs = [blob("/dir1/def.sigmf-meta"), blob("/dir1"), blob("abc.sigmf-meta")]


class MockBlobServiceClient:
    def get_container_client(container):
        return MockContainer_Client


class MockContainer_Client:
    def list_blobs():  # type: ignore [misc]
        return mock_blobs

    def get_blob_client(blob):
        return MockBlob_Client


class MockBlob_Client:
    def download_blob(**kwargs):
        return MockDownloader


class MockDownloader:
    def readall():  # type: ignore [misc]
        return "{'some':'sigmf-metadata'}"


class TestMetadata(TestCase):
    @patch(
        "metadata_loader.main.call_get_all_metadata_api", side_effect=mock_request_get
    )
    @patch("metadata_loader.main.get_config", return_value=mock_config)
    def test_get_all_meta(self, mockConfig, mockCallGetAllMetadata):
        x = {"accountName": "account", "containerName": "container"}
        mock_args = Namespace(**x)

        self.assertEqual(get_all_meta(mock_args), "[]")

    @patch("metadata_loader.main.call_create_meta_api", side_effect=mock_request_post)
    @patch("metadata_loader.main.get_config", return_value=mock_config)
    def test_create_metadata(self, mockConfig, mockCallCreateMetaApi):
        x = {
            "accountName": "account",
            "containerName": "container",
            "filepath": "/dir1/dir2/file.sigmf-meta",
            "document": "{'abc':'123'}",
        }
        mock_args = Namespace(**x)

        self.assertEqual(
            create_meta(
                mock_args.accountName,
                mock_args.containerName,
                mock_args.filepath,
                mock_args.document,
            ),
            "Success",
        )

    @patch("metadata_loader.main.call_create_meta_api", side_effect=mock_request_post)
    @patch("metadata_loader.main.BlobServiceClient", return_value=MockBlobServiceClient)
    @patch("metadata_loader.main.get_config", return_value=mock_config)
    def test_initial_load(
        self, mockConfig, mockBlobServiceClient, mockCallCreateMetaApi
    ):
        x = {"accountName": "account", "containerName": "container"}
        mock_args = Namespace(**x)

        ret = initial_load_meta(mock_args)

        self.assertEqual(ret, True)
