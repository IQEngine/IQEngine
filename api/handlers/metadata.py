import database.database
from fastapi import APIRouter, Body, Depends, Response

router = APIRouter()


@router.get("/api/datasources/{accountName}/{containerName}/meta", status_code=200)
def get_all_meta(
    accountName,containerName, response: Response, db: object = Depends(database.database.db)
):
    # TODO: Should we validate datasource_id?

    # Return all metadata for this datasource, could be an empty
    # list
    metadata = db.metadata.find({"accountName": accountName, "containerName": containerName})
    result = []
    for datum in metadata:
        datum["_id"] = str(datum["_id"])
        result.append(datum)
    return result


@router.get("/api/datasources/{accountName}/{containerName}/{filepath}/meta", status_code=200)
def get_meta(
    accountName,
    containerName,
    filepath,
    response: Response,
    db: object = Depends(database.database.db),
):
    metadata = db.metadata.find_one(
        {"accountName": accountName,"containerName":containerName, "filepath": filepath}
    )
    if not metadata:
        response.status_code = 404
        return "Not Found"
    metadata["_id"] = str(metadata["_id"])
    return metadata


@router.post("/api/datasources/{accountName}/{containerName}/{filepath}/meta", status_code=201)
def create_meta(
    accountName,
    containerName,
    filepath,
    response: Response,
    db: object = Depends(database.database.db),
    metadata=Body(...),
):
    # Check datasource id is valid

    datasource = db.datasources.find_one(
        {"accountName": accountName, "containerName": containerName}
    )
    if not datasource:
        response.status_code = 404
        return "Datasource Not Found"


    # Check metadata doesn't already exist
    if db.metadata.find_one({"accountName": accountName,"containerName": containerName, "filepath": filepath}):
        response.status_code = 400
        return {"error": "record already exists"}

    # Create the first metadata record
    initial_version = {
        "version_number": 0,
        "accountName": accountName,
        "containerName": containerName,
        "filepath": filepath,
        "metadata": metadata,
    }
    db.metadata.insert_one(initial_version)
    db.versions.insert_one(initial_version)
    return "Success"


def get_latest_version(db, accountName,containerName, filepath):
    cursor = (
        db.versions.find({"accountName": accountName,"containerName":containerName, "filepath": filepath})
        .sort("version", -1)
        .limit(1)
    )
    result = list(cursor)
    if not result:
        return None
    else:
        return result[0]


@router.put("/api/datasources/{accountName}/{containerName}/{filepath}/meta", status_code=204)
def update_meta(
    accountName,
    containerName,
    filepath,
    response: Response,
    db: object = Depends(database.database.db),
    metadata=Body(...),
):
    exists = db.metadata.find_one(
        {"accountName": accountName,"containerName":containerName, "filepath": filepath}
    )
    if exists is None:
        response.status_code = 400
        return {"error": "record does not exists"}
    else:
        latest_version = get_latest_version(db, accountName, containerName, filepath)

        # This is going to be a race condition
        version_number = latest_version["version_number"] + 1
        current_version = db.metadata.find_one(
            {"accountName": accountName,"containerName":containerName, "filepath": filepath}
        )
        doc_id = current_version["_id"]

        new_version = {
            "version_number": version_number,
            "accountName": accountName,
            "containerName": containerName,
            "filepath": filepath,
            "metadata": metadata,
        }
        db.versions.insert_one(new_version)
        db.metadata.update_one(
            {"_id": doc_id},
            {"$set": {"metadata": metadata, "version_number": version_number}},
        )
        return "Success"
