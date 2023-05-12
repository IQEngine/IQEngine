import logging
import fastapi
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import os
import copy
from jsonschema import validate
import yaml

with open('openapi.yaml', 'r') as file:
    schema = yaml.safe_load(file)

app = fastapi.FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/detectors")
async def get_detector_list():
    # This just looks at the list of dirs to figure out the detectors available, each dir is assumed to be 1 detector
    dirs = []
    for file in os.listdir('.'):
        d = os.path.join('.', file)
        if os.path.isdir(d):
            dirs.append(file)
    dirs.remove('__pycache__')
    dirs.remove('azure_functions')
    return(dirs)

@app.get("/detectors/{detectorname}")
async def get_detect(detectorname: str):
    try:
        print('detectorname:', detectorname)
        Detector = getattr(__import__(detectorname + '.' + detectorname, fromlist=["Detector"]), "Detector")
        schema = copy.deepcopy(Detector.__pydantic_model__.schema()['properties'])
        del Detector
        # Remove the standard params
        del schema['sample_rate']
        del schema['center_freq']
        print(schema)
        return(schema)
    except AttributeError:
        raise fastapi.HTTPException(status_code=404, detail="Detector schema could not be generated")
    except KeyError as err:
        print(err)

@app.post("/detectors/{detectorname}")
async def detect(info : fastapi.Request, detectorname):
    try:
        Detector = getattr(__import__(detectorname + '.' + detectorname, fromlist=["Detector"]), "Detector")
        logging.info("loaded detector")
    except ModuleNotFoundError as e:
        return {"status" : "FAILED - detector does not exist", "annotations": []}

    function_input = await info.json()

    # Validate with our schema TOOK TOO LONG
    #try:
    #    validate(instance=function_input, schema=schema["paths"]["/detectors/{detectorname}"]['post']['requestBody']['content']['application/json']['schema'])
    #except Exception as e:
    #    print("POST body failed schema validation, error:", e)

    samples = function_input.pop("samples") # Assumed to be real or floats in IQIQIQIQ (cant send complex over JSON)
    print(function_input)

    if not samples:
        return {
        "status" : "FAILED",
        "annotations" : []
    }
    samples = np.asarray(samples)
    if samples.size % 2 == 1:
        return {"status" : "FAILED - number of samples was not an even number", "annotations": []}
    samples = samples[::2] + 1j*samples[1::2]
    samples = samples.astype(np.complex64)

    DetectorInstance = Detector(**function_input) # a way to provide params as a single dict
    annotations = DetectorInstance.detect(samples)
    logging.info(annotations)

    # Validate with our schema
    try:
        validate(instance=function_input, schema=schema["paths"]["/detectors/{detectorname}"]['post']['responses']['200']['content']['application/json']['schema'])
    except Exception as e:
        print("Detector's return annotations failed schema validation, error:", e)

    return {
        "status" : "SUCCESS",
        "annotations" : annotations
    }

# When running as an azure function this is used
if os.getenv('ON_AZURE'):
    import azure.functions as func
    async def main(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
        return await func.AsgiMiddleware(app).handle_async(req, context)
