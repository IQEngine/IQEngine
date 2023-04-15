To run FastAPI functions locally for testing:
```
sudo apt install uvicorn
sudo pip install -r requirements.txt
cd detectors
uvicorn detector_api:app --reload
```

To run the example call, install the vscode extension called "REST Client" then when you open the .http file there should be a "send request" button

The way it works is the detector name must match the directory and .py file within that directory, for fastapi to see it (e.g. markos_detector/markos_detector.py).  It must also have the top-level function called detect with the following params:
```
detect(samples, sample_rate, center_freq, detector_settings)
```
where samples is a 1D numpy array of complex64,  sample_rate/center_freq are scalars in Hz, and detector_settings is a dictionary for your custom detector settings that is only 1 level deep (i.e. a python dict full of key/value pairs).  The return of detect() must be a list of SigMF annotations, see markos_detector.py for an example (it also helps to reference the annotations part of the SigMF standard).  Aside from that detect() function you can organize your detector code however you want.

TODO: instructions for how to make your own detector

## Notes

When deploying with Azure remember to go into the function apps Configuration and under Application Settings there needs to be one for AzureWebJobsStorage which is the storage account connection string, as well as MongoDBConnString
