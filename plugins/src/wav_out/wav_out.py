# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

from base64 import b64encode
from os import path

from pydantic.dataclasses import dataclass


@dataclass
class Plugin:
    """
    The name of the .py file (this file) and it's parent folder
    must match exactly.
    sample_rate and center_freq are standard and must be included
    There must be at least one custom param or the Run Plugin
    button will not show up.
    data_output is part of the contract
    data_type is part of the contract
    """

    sample_rate: int = 0
    center_freq: int = 0

    def run(self, samples):
        file_path = path.dirname(path.realpath(__file__))
        with open(f"{file_path}/sheep.wav", mode="rb") as wavfile:
            wav_file_content = wavfile.read()

        samples_obj = {
            "samples": b64encode(wav_file_content),
            "sample_rate": self.sample_rate,
            "center_freq": self.center_freq,
            "data_type": "audio/wav",
        }
        return {"status": "SUCCESS", "data_output": [samples_obj], "annotations": []}
