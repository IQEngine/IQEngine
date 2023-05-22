# vim: tabstop=4 shiftwidth=4 expandtab
    
import os
from flask import Flask, request
from pymongo import MongoClient
from bson.objectid import ObjectId

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
    
    #@app.route('/api/datasources', methods=['POST'])
    def create_datasource():
        datasource = request.json
        datasource_id = db.datasources.insert_one(datasource).inserted_id
        return str(datasource_id),201
    
    #@app.route('/api/datasources', methods=['GET'])
    def get_all_datasources():
        datasources = db.datasources.find()
        result = []
        for datasource in datasources:
            datasource['_id'] = str(datasource['_id']) 
            result.append(datasource)
        return {"datasources": result}
    
    #@app.route('/api/datasources/<datasource_id>/meta', methods=['GET'])
    def get_all_meta(datasource_id):
        metadata = db.metadata.find({'datasource_id': datasource_id})
        result = []
        for datum in metadata:
            datum['_id'] = str(datum['_id'])
            result.append(datum)
        return {"metadata": result}

    #@app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['GET'])
    def get_meta(datasource_id, filepath):
        metadata = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        metadata['_id'] = str(metadata['_id'])
        return metadata

    #@app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['POST'])
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
            return str(metadata_id),201
    
    #@app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['PUT'])
    def update_meta(datasource_id, filepath):
        current_version = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        version_number = current_version['version_number'] + 1
        new_version = {
            'version_number': version_number,
            'datasource_id': datasource_id,
            'filepath': filepath,
            'metadata': request.json
        }
        db.versions.insert_one(current_version)
        db.metadata.update_one({'datasource_id': datasource_id, 'filepath': filepath}, {'$set': new_version})
        return "{message: 'success'}", 204

    #@app.route('/')
    def index():
        return app.send_static_file('index.html')
    
    #@app.route('/api/datasources', methods=['POST'])
    def create_datasource():
        datasource = request.json
        datasource_id = db.datasources.insert_one(datasource).inserted_id
        return str(datasource_id)
    
    #@app.route('/api/datasources', methods=['GET'])
    def get_all_datasources():
        datasources = db.datasources.find()
        result = []
        for datasource in datasources:
            datasource['_id'] = str(datasource['_id']) 
            result.append(datasource)
        return {"datasources": result}
    
    #@app.route('/api/datasources/<datasource_id>/meta', methods=['GET'])
    def get_all_meta(datasource_id):
        metadata = db.metadata.find({'datasource_id': datasource_id})
        result = []
        for datum in metadata:
            datum['_id'] = str(datum['_id'])
            result.append(datum)
        return {"metadata": result}

    #@app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['GET'])
    def get_meta(datasource_id, filepath):
        metadata = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        metadata['_id'] = str(metadata['_id'])
        return metadata

    @app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['POST'])
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
    
    """
    def get_latest_version(datasource_id, filepath):
        # Isn't latest version always current version? i.e. in metadata and not versions
        return db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath}, sort=[('version_number', -1)])
    """
    
    @app.route('/api/datasources/<datasource_id>/<filepath>/meta', methods=['PUT'])
    def update_meta(datasource_id, filepath):
        current_version = db.metadata.find_one({'datasource_id': datasource_id, 'filepath': filepath})
        if current_version == None:
          return "Not found", 404

        # This is going to be a race condition
        version_number = current_version['version_number'] + 1

        new_version = {
            'version_number': version_number,
            'datasource_id': datasource_id,
            'filepath': filepath,
            'document': request.json
        }
        result = db.versions.insert_one(current_version)
        result = db.metadata.update_one({'datasource_id': datasource_id, 'filepath': filepath}, {'$set': {}})
        return "Success", 200

    @app.route('/api/status')
    def get_status():
        return "OK"
    
    return app
    

if "__Name__" == "__main__":
    app = create_app()
    app.run()
