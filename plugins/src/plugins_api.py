import copy
import logging
import os

import fastapi
from fastapi.middleware.cors import CORSMiddleware
from models.plugins import Plugin
from samples import (
    get_custom_params,
    get_from_samples_b64,
    get_from_samples_cloud,
    validate_samples,
)

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
async def get_plugin_definition(plugin_name: str):
    core_definition = await get_core_plugin_definition(plugin_name)
    definition = copy.deepcopy(
        core_definition.__pydantic_model__.schema()["properties"]
    )
    del definition["sample_rate"]
    del definition["center_freq"]
    return definition


@app.post("/plugins/{plugin_name}")
async def run(plugin_name, plugin: Plugin):
    plugin_definition = await get_core_plugin_definition(plugin_name)
    try:
        validate_samples(plugin.samples_b64, plugin.samples_cloud)

        if plugin.samples_b64:
            samples = get_from_samples_b64(plugin.samples_b64[0])
            custom_params = get_custom_params(plugin, plugin.samples_b64[0])
        else:
            samples = await get_from_samples_cloud(plugin.samples_cloud[0])
            custom_params = get_custom_params(plugin, plugin.samples_cloud[0])
            # Extract samples

        plugin_instance = plugin_definition(
            **custom_params
        )  # a way to provide params as a single dict

        return plugin_instance.run(
            samples
        )  # all python plugins should have a run method that takes in the samples
    except ValueError as e:
        raise fastapi.HTTPException(
            status_code=400, detail="Invalid parameters: " + str(e)
        )
    except Exception as e:
        logging.error(e)
        raise fastapi.HTTPException(
            status_code=500, detail="Unknown error in plugins_api"
        )


async def get_core_plugin_definition(plugin_name: str):
    try:
        print("plugin_name:", plugin_name)
        return getattr(
            __import__(plugin_name + "." + plugin_name, fromlist=["Plugin"]), "Plugin"
        )
    except AttributeError:
        raise fastapi.HTTPException(
            status_code=404, detail="Plugin definition could not be generated"
        )
    except KeyError as err:
        print(err)
        raise fastapi.HTTPException(
            status_code=500, detail="Error in plugin definition"
        )
    except ModuleNotFoundError:
        raise fastapi.HTTPException(status_code=404, detail="Plugin does not exist")


# When running as an azure function this is used
if os.getenv("ON_AZURE"):
    import azure.functions as func

    async def main(req: func.HttpRequest, context: func.Context) -> func.HttpResponse:
        return await func.AsgiMiddleware(app).handle_async(req, context)
