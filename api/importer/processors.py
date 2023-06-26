

import os
import json
from database.database import processors_collection

def import_processors_from_env(enviroment_variable_name = "IQENGINE_PROCESSORS"):
    """
    Import processors from enviroment variable
    Will not import if processor already exists
    """
    processors_json = os.getenv(enviroment_variable_name, None)
    if not processors_json:
        return None
    processors = json.loads(processors_json)

    client = processors_collection()
    for processor in processors:
        if client.find_one({"name": processor["name"]}, {"_id": 1}):
            continue
        client.insert_one(processor)


