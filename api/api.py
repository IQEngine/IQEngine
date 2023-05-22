import os
from flask import Flask, request
from pymongo import MongoClient
from bson.objectid import ObjectId

connection_string = os.getenv('COSMOS_DB_CONNECTION_STRING')
app = Flask(__name__)

client = MongoClient(connection_string)
db = client.RFDX 
metadata = db['current']
metadata_versions = db['versions']


    @app.route('/')
    def index():
        return app.send_static_file('index.html')
    
    @app.route('/api/datasources', methods=['POST'])
    def create_datasource():
        datasource = request.json
        datasource_id = db.datasources.insert_one(datasource).inserted_id
        return str(datasource_id)
    
    @app.route('api/datasources', methods=['GET'])
    def get_all_datasources():
        datasources = db.datasources.find()
        result = []
        for datasource in datasources:
            datasource['_id'] = str(datasource['_id']) 
            result.append(datasource)
        return {"datasources": result}
    
    @app.route('api/datasources/<datasource_id>/meta', methods=['GET'])
    def get_all_meta(datasource_id):
        metadata = db.metadata.find({'datasource_id': datasource_id})
        result = []
        for datum in metadata:
            datum['_id'] = str(datum['_id'])
            result.append(datum)
        return {"metadata": result}

    @app.route('api/datasources/<datasource_id>/<filepath>/meta', methods=['GET'])
    def get_meta(datasource_id, filepath):
        metadata = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        metadata['_id'] = str(metadata['_id'])
        return metadata

    @app.route('api/datasources/<datasource_id>/<filepath>/meta', methods=['POST'])
    def create_meta(datasource_id, filepath):
        exists = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        if exists:
            return {"error":"record already exists"}, 400
        else:
            metadata = request.json
            metadata['datasource_id'] = datasource_id
            metadata['filepath'] = filepath
            metadata['version_number'] = 0
            metadata_id = db.metadata.insert_one(metadata).inserted_id
            return str(metadata_id)
    
    def get_latest_version(datasource_id, filepath):
        return metadata_versions.find_one({'datasource_id': datasource_id, 'filepath': filepath}, sort=[('version_number', -1)])
    
    @app.route('api/datasources/<datasource_id>/<filepath>/meta', methods=['PUT'])
    def update_meta(datasource_id, filepath):
        current_version = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        latest_version = get_latest_version(datasource_id, filepath)
        version_number = latest_version['version_number'] + 1
        new_version = {
            'version_number': version_number,
            'datasource_id': datasource_id,
            'filepath': filepath,
            'document': request.json
        }
        metadata_versions.insert_one(current_version)
        metadata.update_one({'datasource_id': datasource_id, 'filepath': filepath}, {'$set': new_version})


    @app.route('/api/status')
    def get_status():
        return "OK"


    

    
    return app


if "__Name__" == "__main__":
    app = create_app()
    app.run()
