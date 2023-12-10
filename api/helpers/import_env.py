import time
import os
import random
from app.datasources import import_datasources_from_env
from app.plugins import import_plugins_from_env
from app.config import import_default_config_from_env

# For whatever reason we cant define the 3 above in this file or else the mocks fail

async def import_all_from_env():
    # Sleep a random amount of time so that the multiple workers dont all initialize stuff at the exact same time
    time.sleep(random.randint(0, 10000) / 1000) # 0-10 seconds, to greatly reduce risk of duplicates
    print(f"import_all_from_env starting on PID {os.getpid()} at {time.time()}")
    try:
        await import_plugins_from_env()
        await import_default_config_from_env()
        await import_datasources_from_env()
    except Exception as e:
        print("Failed to import all from env", e)
        return None
