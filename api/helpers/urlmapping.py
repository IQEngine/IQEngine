from enum import Enum


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
