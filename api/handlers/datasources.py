import database.database
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Response

router = APIRouter()
    
class Datasource(BaseModel):
    name: str
    accountName: str
    containerName: str
    description: str

@router.post("/api/datasources", status_code = 201)
def create_datasource(datasource: Datasource, response: Response, db: object = Depends(database.database.db)):
    if db.datasources.find_one({"accountName" : datasource.accountName, "containerName" : datasource.containerName }):
        response.status_code = 400
        return "Datasource Already Exists"
    datasource_id = db.datasources.insert_one(datasource.dict()).inserted_id
    return str(datasource_id)

@router.get("/api/datasources")
def get_datasources(db: object = Depends(database.database.db)):
    datasources = db.datasources.find()
    result = []
    for datasource in datasources:
        datasource['_id'] = str(datasource['_id']) 
        result.append(datasource)
    return {"datasources": result}
