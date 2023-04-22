To run FastAPI functions locally for testing:
```
sudo apt install uvicorn
sudo pip install -r requirements.txt
cd detectors
uvicorn detector_api:app --reload
```

IQEngine is currently set up to use http://127.0.0.1:8000/detectors/ as the detection endpoint so as long as your uvicorn chose port 8000 you should be able to go to www.iqengine.org or run the webapp locally and using the detection menu will hit your locally running detector app.  

To run the example call, install the vscode extension called "REST Client" then when you open the .http file there should be a "send request" button

The way it works is the detector name must match the directory and .py file within that directory, for fastapi to see it (e.g. markos_detector/markos_detector.py).  

See the template_detector for how the input and outputs of the function work, if you want to create your own detector.

## Notes

When deploying with Azure remember to go into the function apps Configuration and under Application Settings there needs to be one for AzureWebJobsStorage which is the storage account connection string, as well as MongoDBConnString
