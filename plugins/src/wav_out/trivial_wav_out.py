# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import base64

from pydantic.dataclasses import dataclass

filename = "Windows Foreground.wav"

@dataclass
class Plugin:

    def run(self, samples):

        with open(filename, mode='rg') as wavfile:
            wav_file_content = wavfile.read()

        samples_obj = {
            "samples": base64.b64encode(wav_file_content),
        }
        return {"status": "SUCCESS", "data_output": [samples_obj], "annotations": []}
