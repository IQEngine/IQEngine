import logging
import fastapi
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
import os

app = fastapi.FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/sample")
async def index():
    return {
        "info": "Try /hello/Shivani for parameterized route.",
    }

@app.get("/hello/{name}")
async def get_name(name: str):
    return {
        "name": name,
    }

@app.get("/detect/{detectorname}")
async def get_detect(detectorname: str):
    logging.info("got here")
    try:
        detect_func = getattr(__import__(detectorname + '.' + detectorname, fromlist=["detect"]), "detect")
        logging.info("loaded detector")
    except ModuleNotFoundError as e:
        return {"status" : "FAILED - detector does not exist", "annotations": []}
    return {
        "detectorname": detectorname,
    }

@app.post("/detect/{detectorname}")
async def detect(info : fastapi.Request, detectorname):
    try:
        detect_func = getattr(__import__(detectorname + '.' + detectorname, fromlist=["detect"]), "detect")
        logging.info("loaded detector")
    except ModuleNotFoundError as e:
        return {"status" : "FAILED - detector does not exist", "annotations": []}

    function_input = await info.json()
    samples = function_input["samples"] # Assumed to be real or floats in IQIQIQIQ (cant send complex over JSON)
    if not samples:
        return {
        "status" : "FAILED",
        "annotations" : []
    }
    samples = np.asarray(samples)
    if samples.size % 2 == 1: # in case it comes in odd just remove the last element
        samples = samples[:-1]
    samples = samples[::2] + 1j*samples[1::2]
    samples = samples.astype(np.complex64)
    annotations = detect_func(samples,
                              function_input.get("sample_rate", 1),
                              function_input.get("center_freq", 0),
                              function_input.get("detector_settings",{}))
    logging.info(annotations)
    return {
        "status" : "SUCCESS",
        "annotations" : annotations
    }

# When running as an azure function this is used
if os.getenv('ON_AZURE'):
    import azure.functions as func
    async def main(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
        return await func.AsgiMiddleware(app).handle_async(req, context)
