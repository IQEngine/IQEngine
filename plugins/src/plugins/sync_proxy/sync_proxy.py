import json
import base64
import cv2
import io
import numpy as np
from models.models import MetadataFile, Output
from models.plugin import Plugin
import os
import urllib.request
import requests

display_url = os.environ.get('IQENGINE_PROXY_DISPLAY', 'False').lower() in ['true', '1', 't', 'y', 'yes']
proxy_url = os.environ.get('IQENGINE_PROXY_URL', 'http://127.0.0.1:9000/plugins/userdef')

class sync_proxy(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    def get_definition(self):
        with urllib.request.urlopen(proxy_url) as response:
            definition = response.read()
            definition = json.loads(definition)
            # Add proxy_url
            if display_url:
                definition['proxy_url'] = {
                    'title': 'The url of the async url',
                    'type': 'string',
                    'default': proxy_url
                }
            return definition

    def set_custom_params(self, custom_params: dict):
        self.custom_params = custom_params

    def rf_function(self, samples, job_context=None):
        job_id = job_context.job_id

        samples = samples.tobytes()
        samples = base64.b64encode(samples)
        samples = samples.decode('ascii')
        data = {
            'custom_params': self.custom_params,
            'samples_b64': [{
                'samples': samples,
                'data_type': 'iq/cf32_le',
                'sample_rate': self.sample_rate
            }]
        }
        # print(data)
        proxy_url = self.custom_params['proxy_url']
        r = requests.post(url=proxy_url, json=data)
        r = r.json()
        # print(r)
        details = r.get('details', None)
        if details is not None:
            self.set_status(job_id, 100, str(details))
            return Output()
        else:
            first_samples = r['data_output'][0]
            samples_b64 = first_samples['samples']
            data_type = first_samples.get('data_type', 'iq/cf32_le')
            sample_rate = first_samples.get('sample_rate', self.sample_rate)
            center_freq = first_samples.get('center_freq', self.center_freq)
            metadata = MetadataFile(
                file_name=job_context.file_name or 'iqfile',
                data_type=data_type,
                sample_rate=sample_rate,
                center_freq=center_freq,
            )

            return Output(metadata_file=metadata, output_data=samples_b64)
