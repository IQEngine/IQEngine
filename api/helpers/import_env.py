import time
import os
import random
from app.datasources import import_datasources_from_env
from app.plugins import import_plugins_from_env
from app.config import import_default_config_from_env
from app.database import db

# For whatever reason we cant define the 3 above in this file or else the mocks fail

async def import_all_from_env():
    # Sleep a random amount of time so that the multiple workers dont all initialize stuff at the exact same time
    worker_lock_collection = db().worker_lock
    time.sleep(random.randint(0, 1000) / 1000) # 0-1 seconds
    if not await worker_lock_collection.find_one(): # semaphore
        worker_lock_collection.insert_one({"worker_id": os.getpid()})
        print("This worker is performing the import_all_from_env")
    else:
        print("This worker is NOT performing the import_all_from_env")
        return None

    print(f"import_all_from_env starting on PID {os.getpid()} at {time.time()}")
    try:
        await import_plugins_from_env()
        await import_default_config_from_env()
        await import_datasources_from_env()
        await worker_lock_collection.delete_one({"worker_id": os.getpid()})
        if not await worker_lock_collection.find_one(): # semaphore
            print("Successfully cleared semaphore!")
    except Exception as e:
        print("Failed to import all from env", e)
        return None
