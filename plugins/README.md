To run FastAPI functions locally for testing:

First edit your .env file to include `VITE_PLUGINS_ENDPOINT=http://localhost:8000/plugins/`

```
sudo apt install uvicorn ffmpeg libsm6 libxext6 -y
cd plugins/src
sudo pip install -r requirements.txt
uvicorn plugins_api:app --reload
```

IQEngine is currently set up to use <http://127.0.0.1:8000/plugins/> as the plugins endpoint so as long as your uvicorn chose port 8000 you should be able to go to www.iqengine.org or run the webapp locally and using the plugins menu will hit your locally running plugins app.

To run the example call, install the vscode extension called "REST Client" then when you open the .http file there should be a "send request" button

The way it works is the plugin name must match the directory and .py file within that directory, for fastapi to see it (e.g. markos_detector/markos_detector.py).

See the template_plugin for how the input and outputs of the function work, if you want to create your own plugin.

## Notes

When deploying with Azure remember to go into the function apps Configuration and under Application Settings there needs to be one for AzureWebJobsStorage which is the storage account connection string, as well as MongoDBConnString

To set up certs, configure the DNS name for the VM (under Overview) then fill out "DNS name label" to get a xxx.cloudapp.azure.com domain, then follow these instructions <https://certbot.eff.org/instructions?ws=other&os=ubuntufocal>.  Certs get saved in /etc/letsencrypt/live/xxx so the new uvicorn command is:
```
sudo uvicorn plugins_api:app --host 0.0.0.0 --port 8000 --ssl-keyfile=/etc/letsencrypt/live/iqengine-detector.eastus2.cloudapp.azure.com/privkey.pem --ssl-certfile=/etc/letsencrypt/live/iqengine-detector.eastus2.cloudapp.azure.com/fullchain.pem
```
