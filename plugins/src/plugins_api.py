import io
import json
import logging
import os
from typing import Optional, Tuple
import uuid

from fastapi.responses import FileResponse
import numpy as np
from fastapi import BackgroundTasks, Body, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models.plugin import Plugin
from models.models import DataObject, JobStatus, MetadataCloud, MetadataFile, Output
from samples import get_from_samples_cloud

import re

def sanitize(job_id):
    return re.sub(r'[^\w-]+', '', job_id)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/plugins")
async def get_list_of_plugins():
    # This just looks at the list of dirs to figure out the plugins available, each dir is assumed to be 1 plugin
    dirs = []
    for file in os.listdir("."):
        d = os.path.join(".", file)
        if os.path.isdir(d) and os.path.isfile(os.path.join(d, file + ".py")):
            dirs.append(file)
    if "__pycache__" in dirs:
        dirs.remove("__pycache__")
    if "template_plugin" in dirs:
        dirs.remove("template_plugin")
    return dirs

@app.get("/plugins/{function_name}")
async def get_custom_params(function_name: str):
    plugin = await get_plugin_instance(function_name)
    return plugin.get_definition()

@app.post("/plugins/{function_name}")
async def start_plugin(background_tasks: BackgroundTasks,
                       function_name: str,
                       metadata_file: MetadataFile = Body(...),
                       iq_file: UploadFile = File(...),
                       custom_params: Optional[str] = Form(None)):

    plugin_params = json.loads(custom_params)  # parse custom_params into a dictionary
    plugin = await get_plugin_instance(function_name)

    try:
        samples = np.fromfile(iq_file.file, dtype=np.complex64)
        plugin_params["sample_rate"] = metadata_file.sample_rate
        plugin_params["center_freq"] = metadata_file.center_freq

        # add params to the plugin
        plugin.set_custom_params(plugin_params)

        job_id = str(uuid.uuid4())  # create a unique id for the job
        if not os.path.isdir("jobs"):  # check if plugin server has a jobs directory
            os.mkdir("jobs")

        # put json file with job status in jobs directory
        job_context = JobStatus(job_id=job_id, file_name=metadata_file.file_name, function_name=function_name, progress=0)
        with open(os.path.join("jobs", job_id + ".json"), "w") as f:
            f.write(job_context.model_dump_json(indent=4))

        # start the plugin in the background
        # all python plugins should have a run method that takes in the samples and a uuid
        background_tasks.add_task(plugin.run, samples, job_context)

        return job_context.model_dump(exclude_none=True)

    except ValueError as e:
        print(e)
        raise HTTPException(status_code=400, detail="Invalid parameters: " + str(e))

    except Exception as e:
        print(e)
        logging.error(e)
        raise HTTPException(status_code=500, detail="Unknown error in plugins_api")

@app.get("/plugins/{job_id}/status")
async def get_job_status(job_id: str):
    try:
        job_id = sanitize(job_id)

        with open(os.path.join("jobs", job_id + ".json"), "r") as f:
            return JobStatus(**json.load(f)).model_dump(exclude_none=True)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Job not found")

@app.get("/plugins/{job_id}/result")
async def get_job_result(job_id: str):
    job_id = sanitize(job_id)
    job_status = await get_job_status(job_id)
    if job_status["progress"] != 100:
        raise HTTPException(status_code=400, detail="Job not complete")

    if job_status["error"]:
        raise HTTPException(status_code=400, detail=job_status["error"])

    try:
        path = os.path.join("results", job_id, job_id + ".json")
        with open(path, "r") as f:
            dict = json.load(f)
            output = Output(job_status=job_status, **dict)

        return output.model_dump(exclude_none=True, by_alias=True)

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Result not found")

async def get_plugin_instance(plugin_name: str) -> Plugin:
    try:
        print("plugin_name:", plugin_name)
        module = __import__(plugin_name + "." + plugin_name, fromlist=["Plugin"])
        pluginClass = getattr(module, plugin_name)
        return pluginClass()
    except AttributeError:
        raise HTTPException(status_code=404, detail="Plugin definition could not be generated")
    except KeyError as err:
        print(err)
        raise HTTPException(status_code=500, detail="Error in plugin definition")
    except ModuleNotFoundError as err:
        print(err)
        raise HTTPException(status_code=404, detail="Plugin does not exist")
