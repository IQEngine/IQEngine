from pydantic import SecretStr
from .cipher import decrypt
from enum import Enum


class uiImage(Enum):
    IMAGE = 1
    THUMB = 2


def add_imageURL_sasToken(account, container, sasToken, filepath, uiImage: uiImage):
    if (
        sasToken is not None
        and sasToken != ""
    ):
        # linter fix for error: "get_secret_value" is not a known member of "None" (reportOptionalMemberAccess)
        x = decrypt(sasToken)
        y = ""
        if x is not None:
            y = x.get_secret_value()

        if uiImage == uiImage.THUMB and filepath is not None and filepath != "":
            bloburl = f'https://{account}.blob.core.windows.net/{container}/{filepath}.jpg'
        elif uiImage == uiImage.IMAGE:
            bloburl = f'https://{account}.blob.core.windows.net/{container}/image.jpg'
        else:
            raise ValueError("Invalid uiImage value")

        imageURL_sasToken = SecretStr(bloburl + "?" + y)
        return imageURL_sasToken
    else:
        return SecretStr("")
