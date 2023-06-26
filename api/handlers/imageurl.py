from pydantic import SecretStr
from enum import Enum
from .cipher import decrypt
from fastapi import Depends
from enum import Enum


class uiImage(str, Enum):
    THUMB = "thumb"
    IMAGE = "image"


def add_imageURL_sasToken(datasource, uiImage: uiImage = Depends(uiImage)):
    if (
        "imageURL" in datasource
        and "sasToken" in datasource
        and datasource["sasToken"] is not None
        and datasource["sasToken"] != ""
    ):
        # linter fix for error: "get_secret_value" is not a known member of "None" (reportOptionalMemberAccess)
        x = decrypt(datasource["sasToken"])
        y = ""
        if x is not None:
            y = x.get_secret_value()

        if uiImage == uiImage.THUMB:
            bloburl = f'https://{datasource["account"]}.blob.core.windows.net/{datasource["container"]}/thumb.jpg'
        elif uiImage == uiImage.IMAGE:
            bloburl = f'https://{datasource["account"]}.blob.core.windows.net/{datasource["container"]}/image.jpg'
        else:
            raise ValueError("Invalid uiImage value")

        imageURL_sasToken = SecretStr(bloburl + "?" + y)
        return imageURL_sasToken
    #else:
        #return Should show a default lost image
