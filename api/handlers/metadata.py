import database.database
from bson.errors import InvalidId
from bson.objectid import ObjectId
from fastapi import APIRouter, Body, Response, Depends

router = APIRouter()

@router.get('/api/datasources/{datasource_id}/meta', status_code = 200)
def get_all_meta(datasource_id, response: Response, db: object = Depends(database.database.db)):
    
    # TODO: Should we validate datasource_id?
    
    # Return all metadata for this datasource, could be an empty
    # list
    metadata = db.metadata.find({'datasource_id': datasource_id})
    result = []
    for datum in metadata:
        datum['_id'] = str(datum['_id'])
        result.append(datum)
    return result

@router.get('/api/datasources/{datasource_id}/{filepath}/meta', status_code = 200)
def get_meta(datasource_id, filepath, response: Response, db: object = Depends(database.database.db)):
    metadata = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
    if not metadata:
        response.status_code = 404 
        return "Not Found"
    metadata['_id'] = str(metadata['_id'])
    return metadata

@router.post('/api/datasources/{datasource_id}/{filepath}/meta', status_code = 201)
def create_meta(datasource_id, filepath, response: Response, db: object = Depends(database.database.db), metadata = Body(...)):

      # Check datasource id is valid
      try:
        datasource = db.datasources.find_one({"_id" : ObjectId(datasource_id)})
        if not datasource:
            response.status_code = 404
            return "Datasource Not Found"
      except InvalidId:
          response.status_code = 400
          return "Invalid ObjectId"

      # Check metadata doesn't already exist
      if db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath}):
          response.status_code = 400
          return {"error":"record already exists"}

      # Create the first metadata record
      initial_version = {
          'version_number': 0,
          'datasource_id': datasource_id,
          'filepath': filepath,
          'metadata': metadata
      }
      result = db.metadata.insert_one(initial_version)
      db.versions.insert_one(initial_version)
      return "Success"

def get_latest_version(db, datasource_id, filepath):
    cursor = db.versions.find({'datasource_id': datasource_id, 'filepath': filepath}).sort('version', -1).limit(1)
    result = list(cursor)
    if not result:
        return None
    else:
        return result[0]

@router.put('/api/datasources/{datasource_id}/{filepath}/meta', status_code = 204)
def update_meta(datasource_id, filepath, response: Response, db: object = Depends(database.database.db), metadata = Body(...)):
    exists = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
    if exists == None:
        response.status_code = 400
        return {"error":"record does not exists"}
    else:
        latest_version = get_latest_version(db, datasource_id, filepath)

        # This is going to be a race condition
        version_number = latest_version['version_number'] + 1
        current_version = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        doc_id = current_version['_id']

        new_version = {
            'version_number': version_number,
            'datasource_id': datasource_id,
            'filepath': filepath,
            'metadata': metadata
        }
        db.versions.insert_one(new_version)
        db.metadata.update_one({'_id': doc_id}, {'$set': {'metadata': metadata, 'version_number': version_number}})
        return "Success"