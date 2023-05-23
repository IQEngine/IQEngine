from .database import db
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
    
class Datasource(BaseModel):
    name: str
    accountName: str
    containerName: str
    description: str

@router.post("/api/datasources", status_code = 201)
def create_datasource(datasource: Datasource):
    # TODO: Validate input, what about collisions?
    datasource_id = db().datasources.insert_one(datasource.dict()).inserted_id
    return str(datasource_id)

@router.get("/api/datasources")
def get_datasources():
    datasources = db().datasources.find()
    result = []
    for datasource in datasources:
        datasource['_id'] = str(datasource['_id']) 
        result.append(datasource)
    return {"datasources": result}
