import base64
import copy
import logging
import os

import fastapi
import numpy as np
from fastapi.middleware.cors import CORSMiddleware

app = fastapi.FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/plugins")
async def get_plugins_list():
    # This just looks at the list of dirs to figure out the plugins available, each dir is assumed to be 1 plugin
    dirs = []
    for file in os.listdir("."):
        d = os.path.join(".", file)
        if os.path.isdir(d):
            dirs.append(file)
    dirs.remove("__pycache__")
    dirs.remove("azure_functions")
    dirs.remove("template_plugin")
    return dirs


@app.get("/plugins/{plugin_name}")
async def get_plugin(plugin_name: str):
    try:
        print("plugin_name:", plugin_name)
        Plugin = getattr(
            __import__(plugin_name + "." + plugin_name, fromlist=["Plugin"]), "Plugin"
        )
        schema = copy.deepcopy(Plugin.__pydantic_model__.schema()["properties"])
        del Plugin
        # Remove the standard params
        del schema["sample_rate"]
        del schema["center_freq"]
        print(schema)
        return schema
    except AttributeError:
        raise fastapi.HTTPException(
            status_code=404, detail="Plugin schema could not be generated"
        )
    except KeyError as err:
        print(err)


@app.post("/plugins/{plugin_name}")
async def run(info: fastapi.Request, plugin_name):
    try:
        Plugin = getattr(
            __import__(plugin_name + "." + plugin_name, fromlist=["Plugin"]), "Plugin"
        )
        logging.info("loaded plugin")
    except ModuleNotFoundError:
        return {"status": "FAILED - plugin does not exist", "annotations": []}

    function_input = await info.json()

    try:
        data_input_len = len(function_input.get("data_input", []))
        if not isinstance(function_input.get("data_input", None), list):
            return {"status": "FAILED - data_input wasnt a list", "annotations": []}
        print("data_input length:", data_input_len)
        if data_input_len < 1:
            return {"status": "FAILED - no data_input", "annotations": []}

        # Extract samples
        samples_b64 = function_input["data_input"][0][
            "samples"
        ]  # provided as base64 string of float32 array
        samples = np.frombuffer(
            base64.decodebytes(samples_b64.encode()), dtype=np.complex64
        )
        sample_rate = function_input["data_input"][0]["sample_rate"]
        center_freq = function_input["data_input"][0]["center_freq"]
        custom_params = function_input.get("custom_params", {})
        custom_params["sample_rate"] = sample_rate
        custom_params["center_freq"] = center_freq

        PluginInstance = Plugin(
            **custom_params
        )  # a way to provide params as a single dict

        results = PluginInstance.run(
            samples
        )  # all python plugins should have a run method that takes in the samples
        logging.info(results)

    except Exception as e:
        return {
            "status": "FAILED - unknown error in plugins_api:" + str(e),
            "annotations": [],
        }

    return results


# When running as an azure function this is used
if os.getenv("ON_AZURE"):
    import azure.functions as func

    async def main(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
        return await func.AsgiMiddleware(app).handle_async(req, context)
