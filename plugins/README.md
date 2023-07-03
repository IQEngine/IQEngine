# Plugins

Through a separate backend API, IQEngine supports various plugins, which act as RF functions you can run on sets of IQ samples.
This plugins take in IQ samples, and output either IQ samples or another format, such as bytes, audio, SigMF annotations, etc.
While it is expected that most plugins will take in 1 set of IQ samples, it is possible to provide a set of IQ samples, such as for TDOA or MIMO processing.
Some example plugins we expect to support (using the same plugins API for all) include:

- Signal detectors
- Signal and modulation classifiers
- Modems (demodulation, decoding, etc)
- Filters
- Channel emulators
- Radar
- TDOA
- DOA
- MIMO processing
- Signal generators (the one case that wont take in IQ)

Plugins written in Python can make use of the existing Python plugin server in the /src directory and authors can start from the template plugin.
We expect to create a C++ version of this server and template plugin soon.
Plugins written in other languages will have to implement the full API.

To get a feel for how simple it is to write a Python based plugin, check out the /src/lowpass_filter/low_passfilter.py
code that implements a low-pass filter plugin in a couple dozen lines of Python, no additional boilerplate needed!

## Run plugins locally for testing

First edit your root .env file to include `IQENGINE_PLUGINS: [{"name": "BuiltIn",  "url": "plugins:8000"}]`

```bash
sudo apt install uvicorn ffmpeg libsm6 libxext6 -y
cd plugins/src
sudo pip install -r requirements.txt
uvicorn plugins_api:app --reload
```

IQEngine is currently set up to use <http://127.0.0.1:8000/plugins/> as the plugins endpoint so as long as your uvicorn chose port 8000 you should be able to go to www.iqengine.org or run the webapp locally and using the plugins menu will hit your locally running plugins app.

To run the example call, install the vscode extension called "REST Client" then when you open the .http file there should be a "send request" button

See the template_plugin for how the input and outputs of the function work, if you want to create your own plugin.

## Steps to write a plugin

* Create a folder in plugins/src (for example, myplugin)
* Create the python file. (For example, myplugin/myplugin.py)
* The folder and file name must match exactly.
* Copy this code into myplugin.py:
```python
import base64

from pydantic.dataclasses import dataclass

@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # custom params - at least one required at present
    sample_input: int = 51

    def run(self, samples):
    """
    Do stuff here and put results into outputs_obj
    """
        outputs_obj = {
            "samples": base64.b64encode(samples),
            "sample_rate": self.sample_rate,
            "center_freq": self.center_freq,
            "data_type": "iq/cf32_le",
        }
        return {"status": "SUCCESS", "data_output": [outputs_obj], "annotations": []}
```
* sample_rate and center_freq are standard and must be included in output
* There must be at least one custom param or the Run Plugin button will not show up.
* data_output is a required part of the interface
* data_type is a required part of the interface

## Run plugins locally using docker

```bash
cd plugins
docker build -t plugins_image .
docker run -dit -p 8000:8000 --name plugins_container plugins_image
docker ps
```

`docker ps` should return the following, if everything worked.  You should then be able to run the client and set your .env file as discussed above.

CONTAINER ID   IMAGE           COMMAND                  CREATED          STATUS          PORTS                    NAMES
12ed73ede6a0   plugins_image   "uvicorn --host 0.0.…"   21 seconds ago   Up 19 seconds   0.0.0.0:8000->8000/tcp   plugins_container

Stop with `docker stop plugins_container` and delete with `docker rm plugins_container`.

SSH into container with `docker exec -it plugins_container /bin/bash`

## Notes

When deploying with Azure remember to go into the function apps Configuration and under Application Settings there needs to be one for AzureWebJobsStorage which is the storage account connection string, as well as MongoDBConnString

To set up certs, configure the DNS name for the VM (under Overview) then fill out "DNS name label" to get a xxx.cloudapp.azure.com domain, then follow these instructions <https://certbot.eff.org/instructions?ws=other&os=ubuntufocal>.  Certs get saved in /etc/letsencrypt/live/xxx so the new uvicorn command is:
```bash
sudo uvicorn plugins_api:app --host 0.0.0.0 --port 8000 --ssl-keyfile=/etc/letsencrypt/live/iqengine-detector.eastus2.cloudapp.azure.com/privkey.pem --ssl-certfile=/etc/letsencrypt/live/iqengine-detector.eastus2.cloudapp.azure.com/fullchain.pem
```
