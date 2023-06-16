import io
import database.database
from database.models import DataSource
from fastapi import APIRouter, Depends, HTTPException
from pymongo.collection import Collection
from fastapi.responses import StreamingResponse
from PIL import Image, ImageDraw

router = APIRouter()


@router.post("/api/datasources", status_code=201, response_model=DataSource)
def create_datasource(
    datasource: DataSource,
    datasources: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    """
    Create a new datasource. The datasource will be henceforth identified by account/container which
    must be unique or this function will return a 400.
    """
    if datasources.find_one(
        {
            "account": datasource.account,
            "container": datasource.container,
        }
    ):
        raise HTTPException(status_code=409, detail="Datasource Already Exists")
    datasources.insert_one(datasource.dict(by_alias=True, exclude_unset=True))
    return datasource


@router.get("/api/datasources", response_model=list[DataSource])
def get_datasources(
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    datasources = datasources_collection.find()
    result = []
    for datasource in datasources:
        result.append(datasource)
    return result


@router.get(
        "/api/datasources/{account}/{container}/datasource", 
        response_model=DataSource)
def get_datasource(
    account: str,
    container: str,
    datasources_collection: Collection[DataSource] = Depends(
        database.database.datasources_collection
    ),
):
    datasource = datasources_collection.find_one(
        {
            "account": account,
            "container": container,
        }
    )
    if not datasource:
        raise HTTPException(status_code=404, detail="Datasource not found")
    return datasource


@router.get(
    "/api/datasources/{account}/{container}/image")
def get_generated_image():
    # Generate the image as place holder
    image = Image.new("RGB", (200, 200), (255, 255, 255))
    draw = ImageDraw.Draw(image)
    draw.rectangle((50, 50, 150, 150), fill=(0, 0, 0))

    image_data = io.BytesIO()
    image.save(image_data, format="PNG")
    image_data.seek(0)

    return StreamingResponse(image_data, media_type="image/png")
