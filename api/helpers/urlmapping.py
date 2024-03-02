from enum import Enum
from pydantic import SecretStr
from .cipher import decrypt

class ApiType(Enum):
    IMAGE = 1
    THUMB = 2
    IQDATA = 3
    METADATA = 4
    MINIMAP = 5


def get_content_type(apiType: ApiType):
    match apiType:
        case ApiType.THUMB:
            return "image/jpeg"
        case ApiType.IMAGE:
            return "image/jpeg"
        case ApiType.IQDATA:
            return "application/octet-stream"
        case ApiType.METADATA:
            return "application/octet-stream"  # was "application/json" but it didn't download the file when you clicked it, it opened it in browser, which was annoying considering we are only using this functionality within the downlink link in the recordingslist
        case ApiType.MINIMAP:
            return "application/octet-stream"
        case _:
            raise ValueError("Invalid ApiType value")


def get_file_name(filepath: str, apiType: ApiType) -> str:
    match apiType:
        case ApiType.THUMB:
            return filepath + ".jpg"
        case ApiType.IMAGE:
            return "datasource_thumbnail.jpg"
        case ApiType.IQDATA:
            return filepath + ".sigmf-data"
        case ApiType.METADATA:
            return filepath + ".sigmf-meta"
        case ApiType.MINIMAP:
            return filepath + ".minimap"
        case _:
            raise ValueError("Invalid ApiType value")


def add_URL_sasToken(account, container, sasToken, filepath, apiType: ApiType):
    match apiType:
        case ApiType.THUMB if filepath and filepath.strip():
            bloburl = (
                f"https://{account}.blob.core.windows.net/{container}/{filepath}.jpg"
            )
        case ApiType.IMAGE:
            bloburl = f"https://{account}.blob.core.windows.net/{container}/datasource_thumbnail.jpg"
        case ApiType.IQDATA if filepath and filepath.strip():
            bloburl = f"https://{account}.blob.core.windows.net/{container}/{filepath}.sigmf-data"
        case ApiType.METADATA if filepath and filepath.strip():
            bloburl = f"https://{account}.blob.core.windows.net/{container}/{filepath}.sigmf-meta"
        case _:
            raise ValueError("Invalid ApiType value")

    if sasToken is not None and sasToken != "":
        # linter fix for error: "get_secret_value" is not a known member of "None" (reportOptionalMemberAccess)
        x = decrypt(sasToken)
        y = ""
        if x is not None:
            y = x.get_secret_value()
        api_URL_sasToken = SecretStr(bloburl + "?" + y)
    else:
        api_URL_sasToken = SecretStr(bloburl)

    return api_URL_sasToken
