import copy
import inspect
import json
import logging
import os
import uuid

import numpy as np
from fastapi import BackgroundTasks, Body, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models.plugin import Plugin
from models.models import JobStatus, MetadataCloud, MetadataFile
from samples import get_from_samples_cloud

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
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

@app.get("/{function_name}")
async def get_custon_params(function_name: str):
    plugin = await get_plugin_instance(function_name)
    return plugin.get_definition()

@app.post("/{function_name}")
async def get_root( background_tasks: BackgroundTasks,
                    function_name: str,
                    metadata_files: list[MetadataFile] = Body(...),
                    iq_files: list[UploadFile] = File(...)):
    plugin = await get_plugin_instance(function_name)
    if len(metadata_files) != len(iq_files):
        raise HTTPException(status_code=400, detail="The number of metadata and files do not match")

    if len(metadata_files) > 1:
        raise HTTPException(status_code=400, detail="Only one metadata file is supported at the moment")

    try:
        custom_params = {}

        samples = np.fromfile(iq_files[0].file, dtype=np.complex64)
        custom_params["sample_rate"] = metadata_files[0].sample_rate
        custom_params["center_freq"] = metadata_files[0].center_freq
        #plugin_instance = plugin_definition(**custom_params)  # a way to provide params as a single dict
        #print(plugin_instance)
        job_id = str(uuid.uuid4()) # create a unique id for the job
        if not os.path.isdir("jobs"):  # check if plugin server has a jobs directory
            os.mkdir("jobs")

        # put json file with job status in jobs directory
        job_status = JobStatus(job_id=job_id, function_name=function_name, progress=0)
        with open(os.path.join("jobs", job_id + ".json"), "w") as f:
            f.write(job_status.model_dump_json(indent=4))
        #start the plugin in the background
        # all python plugins should have a run method that takes in the samples and a uuid
        background_tasks.add_task(plugin.run, samples, job_id)

        return job_status

    except ValueError as e:
        print(e)
        raise HTTPException(status_code=400, detail="Invalid parameters: " + str(e))

    except Exception as e:
        print(e)
        logging.error(e)
        raise HTTPException(status_code=500, detail="Unknown error in plugins_api")

@app.get("/{job_id}/status")
async def get_job_status(job_id: str):
    with open(os.path.join("jobs", job_id + ".json"), "r") as f:
        return json.load(f)

@app.get("/{job_id}/result")
async def get_job_result(job_id: str):
    with open(os.path.join("results", job_id + ".json"), "r") as f:
        return f.read()

async def get_plugin_instance(plugin_name: str) -> Plugin:
    try:
        print("plugin_name:", plugin_name)
        module =  __import__(plugin_name + "." + plugin_name, fromlist=["Plugin"])
        PluginClass = getattr(module, plugin_name)
        return PluginClass()  # Create
    except AttributeError:
        raise HTTPException(status_code=404, detail="Plugin definition could not be generated")
    except KeyError as err:
        print(err)
        raise HTTPException(status_code=500, detail="Error in plugin definition")
    except ModuleNotFoundError as err:
        print(err)
        raise HTTPException(status_code=404, detail="Plugin does not exist")

