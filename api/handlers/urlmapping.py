from pydantic import SecretStr
from .cipher import decrypt
from enum import Enum


class apiType(Enum):
    IMAGE = 1
    THUMB = 2
    IQDATA = 3


def add_URL_sasToken(account, container, sasToken, filepath, apiType: apiType):

    if apiType == apiType.THUMB and filepath is not None and filepath != "":
        bloburl = f'https://{account}.blob.core.windows.net/{container}/{filepath}.jpg'
    elif apiType == apiType.IMAGE:
        bloburl = f'https://{account}.blob.core.windows.net/{container}/datasource_thumbnail.jpg'
    elif apiType == apiType.IQDATA:
        bloburl = f'https://{account}.blob.core.windows.net/{container}/{filepath}.sigmf-data'
    else:
        raise ValueError("Invalid apiType value")

    if (
        sasToken is not None
        and sasToken != ""
    ):
        # linter fix for error: "get_secret_value" is not a known member of "None" (reportOptionalMemberAccess)
        x = decrypt(sasToken)
        y = ""
        if x is not None:
            y = x.get_secret_value()
        api_URL_sasToken = SecretStr(bloburl + "?" + y)
    else:
        api_URL_sasToken = SecretStr(bloburl)

    return api_URL_sasToken
