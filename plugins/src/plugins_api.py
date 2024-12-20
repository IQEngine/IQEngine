import json
import os
import uuid
from typing import Optional

import numpy as np
from config import PLUGIN_PATH
from fastapi import (
    BackgroundTasks,
    Body,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from models.models import JobStatus, MetadataFile, Output
from models.plugin import Plugin
from utils import sanitize

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "try going to /plugins"}


@app.get("/plugins")
async def get_list_of_plugins():
    # This just looks at the list of dirs to figure out the plugins available, each dir is assumed to be 1 plugin
    dirs = []
    for file in os.listdir(PLUGIN_PATH):
        d = os.path.join(PLUGIN_PATH, file)
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
async def start_plugin(
    background_tasks: BackgroundTasks,
    function_name: str,
    metadata_file: MetadataFile = Body(...),
    iq_file: UploadFile = File(...),
    custom_params: Optional[str] = Form(None),
):
    plugin_params = json.loads(custom_params)  # parse custom_params into a dictionary
    plugin = await get_plugin_instance(function_name)

    try:
        samples = np.fromfile(iq_file.file, dtype=np.complex64)
        plugin_params["sample_rate"] = metadata_file.sample_rate
        plugin_params["center_freq"] = metadata_file.center_freq
        plugin.set_custom_params(plugin_params)  # add params to the plugin

        job_id = str(uuid.uuid4())  # create a unique id for the job
        if not os.path.isdir("jobs"):  # check if plugin server has a jobs directory
            os.mkdir("jobs")

        # put json file with job status in jobs directory
        job_context = JobStatus(job_id=job_id, file_name=metadata_file.file_name, function_name=function_name, progress=0)
        with open(os.path.join("jobs", job_id + ".json"), "w") as f:
            f.write(job_context.model_dump_json(indent=4))

        # start the plugin in the background. all python plugins should have a run method that takes in the samples and a uuid
        background_tasks.add_task(plugin.run, samples, job_context)

        return job_context.model_dump(exclude_none=True)

    except ValueError as e:
        print(e)
        raise HTTPException(status_code=400, detail="Invalid parameters: " + str(e))

    except Exception as e:
        print(e)
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
    if job_status.get("progress") != 100:
        raise HTTPException(status_code=400, detail="Job not complete")
    if job_status.get("error"):
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
        module_path = build_module_path(plugin_name)  # replace all slashes with dots to get the correct module path
        module = __import__(module_path, fromlist=["Plugin"])
        pluginClass = getattr(module, plugin_name)
        return pluginClass()
    except AttributeError:
        raise HTTPException(status_code=404, detail="Plugin definition could not be generated")
    except KeyError as err:
        print("Error in get_plugin_instance():", err)
        raise HTTPException(status_code=500, detail="Error in plugin definition")
    except ModuleNotFoundError as err:
        print("Error in get_plugin_instance():", err)
        raise HTTPException(status_code=404, detail="Plugin does not exist")


def build_module_path(plugin_name: str) -> str:
    module_prefix = PLUGIN_PATH.replace("/", ".")  # replace all slashes with dots to get the correct module path
    while module_prefix.endswith("."):  # remove trailing "."s
        module_prefix = module_prefix[:-1]
    while module_prefix.startswith("."):  # remove leading "."s
        module_prefix = module_prefix[1:]
    return f"{module_prefix}.{plugin_name}.{plugin_name}"


# Used in e2e test to verify GNU Radio built and runs properly
@app.get("/test-gnuradio")
async def test_gnuradio():
    try:
        from gnuradio.filter import firdes

        print(dir(firdes))
        return {"status": "success"}
    except ImportError:
        raise HTTPException(status_code=500, detail="GNU Radio not installed")
