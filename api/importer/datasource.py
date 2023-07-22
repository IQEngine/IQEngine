import json
import os

from database import datasource_repo
from database.models import DataSource


async def import_datasources_from_env(
    environment_variable_name="IQENGINE_CONNECTION_INFO",
):
    """
    Imports datasources from environment variable

    Parameters
    ----------
    environment_variable_name : str
        The name of the environment variable to load the datasources from

    Returns
    -------
    None
    """
    try:
        connection_info = os.getenv(environment_variable_name, None)
        if not connection_info:
            return None
        connections = json.loads(connection_info)["settings"]
        for connection in connections:
            if await datasource_repo.datasource_exists(
                connection["accountName"], connection["containerName"]
            ):
                continue
            datasource = DataSource(
                account=connection["accountName"],
                container=connection["containerName"],
                sasToken=connection["sasToken"],
                name=connection["name"],
                description=connection["description"]
                if "description" in connection
                else None,
                imageURL=connection["imageURL"] if "imageURL" in connection else None,
                type="api",
            )
            await datasource_repo.create(datasource=datasource)
    except Exception as e:
        # throw a custom plugin failed to load exception
        raise Exception(
            f"Failed to load plugins from environment variable {environment_variable_name}",
            e,
        )
