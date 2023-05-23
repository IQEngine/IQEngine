# vim: tabstop=4 shiftwidth=4 expandtab
    
import os
from flask import Flask, request
from pymongo import MongoClient

db = None
app = None

def create_db_client():
    connection_string = os.getenv('COSMOS_DB_CONNECTION_STRING')
    return MongoClient(connection_string)

def create_app(db_client = None):

    if db_client == None:
        db_client = create_db_client()
    db = db_client["RFDX"]
 
    app = Flask(__name__, static_folder='./build', static_url_path='/')
    
    @app.route('/api/datasources', methods=['POST'])
    def create_datasource():
        datasource = request.json
        # TODO: Validate input, what about collisions?
        datasource_id = db.datasources.insert_one(datasource).inserted_id
        return str(datasource_id), 201
    
    @app.route('/api/datasources', methods=['GET'])
    def get_all_datasources():
        datasources = db.datasources.find()
        result = []
        for datasource in datasources:
            datasource['_id'] = str(datasource['_id']) 
            result.append(datasource)
        return result
    
    @app.route('/api/datasources/<datasource_id>/meta', methods=['GET'])
    def get_all_meta(datasource_id):
        metadata = db.metadata.find({'datasource_id': datasource_id})
        result = []
        for datum in metadata:
            datum['_id'] = str(datum['_id'])
            result.append(datum)
        return result
    
    @app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['GET'])
    def get_meta(datasource_id, filepath):
        metadata = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        if not metadata:
            return "Not found", 404
        metadata['_id'] = str(metadata['_id'])
        return metadata
    
    @app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['POST'])
    def create_meta(datasource_id, filepath):
        exists = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        if exists:
            return {"error":"record already exists"}, 400
        else:
            initial_version = {
                'version_number': 0,
                'datasource_id': datasource_id,
                'filepath': filepath,
                'metadata': request.json
            }
            result = db.metadata.insert_one(initial_version)
            db.versions.insert_one(initial_version)
            return "Success",201
   
    def get_latest_version(datasource_id, filepath):
        # Isn't latest version always current version? i.e. in metadata and not versions
        cursor = db.versions.find({'datasource_id': datasource_id, 'filepath': filepath}).sort('version', -1).limit(1)
        result = list(cursor)
        if not result:
            return None
        else:
            return result[0]
    
    @app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['PUT'])
    def update_meta(datasource_id, filepath):
        exists = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        if exists == None:
            return {"error":"record does not exists"}, 400
        else:
            latest_version = get_latest_version(datasource_id, filepath)

            # This is going to be a race condition
            version_number = latest_version['version_number'] + 1
            current_version = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
            doc_id = current_version['_id']

            new_version = {
                'version_number': version_number,
                'datasource_id': datasource_id,
                'filepath': filepath,
                'metadata': request.json
            }
            result = db.versions.insert_one(new_version)
            result = db.metadata.update_one({'_id': doc_id}, {'$set': {'metadata': request.json, 'version_number': version_number}})
            return "Success", 204

    @app.route('/api/status')
    def get_status():
        return "OK"
    
    return app
    

if "__Name__" == "__main__":
    app = create_app()
    app.run()
