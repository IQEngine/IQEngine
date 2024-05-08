from abc import ABC, abstractmethod
import inspect
import os
import json
import logging
import traceback

import numpy as np

from models.models import JobStatus, Output
class Plugin(ABC):

    @abstractmethod
    def rf_function(self, samples: np.ndarray, job_context: JobStatus = None) -> Output:
        pass

    def run(self, samples, job_context: JobStatus):
        try:
            job_id = job_context.job_id

            result = self.rf_function(samples, job_context)

            self.store_result(job_id, result)
            self.set_status(job_id, 100)
        except Exception as e:
            tb = traceback.format_exc()
            logging.error(f"Exception occurred: {e}, traceback: {tb}")
            self.set_status(job_id, 100, str(e))

    def set_status(self, job_id: str, progress, error=None):
        with open(os.path.join("jobs", job_id + ".json"), "r") as f:
            job_status = json.load(f)
            job_status["progress"] = progress
            if error:
                job_status["error"] = error

        with open(os.path.join("jobs", job_id + ".json"), "w") as f:
            f.write(json.dumps(job_status, indent=4))

    def store_result(self, job_id: str, result: Output):
        try:
            if not os.path.isdir("results"):
                os.mkdir("results")

            directory = os.path.join("results", job_id)
            os.mkdir(directory)

            # dump result to disk,
            with open(os.path.join(directory, job_id + ".json"), "w") as f:
                f.write(result.model_dump_json(indent=4, exclude_none=True, by_alias=True))

            logging.info(f"Stored result for job {job_id}")

        except Exception as e:
            logging.error(e)
            self.set_status(job_id, 100, str(e))

    def get_definition(self):
        definition = {}
        for i in inspect.getmembers(self):
            if not i[0].startswith('_') and not inspect.ismethod(i[1]):
                if not i[0] == "sample_rate" and not i[0] == "center_freq":
                    definition[i[0]] = {
                        "title": i[0],
                        "default": i[1],
                        "type": type(i[1]).__name__,
                        "value": i[1]
                    }
        return definition

    def set_custom_params(self, custom_params: dict):

        type_map = {
            "float": float,
            "int": int,
            "str": str,
            "bool": bool
            # Add more types if needed
        }

        definition = self.get_definition()
        for key, value in custom_params.items():
            print(key, value)
            if key in definition:
                type_name = definition[key]["type"]
                if type_name in type_map:
                    try:
                        value = type_map[type_name](value)
                        setattr(self, key, value)
                    except ValueError:
                        print(f"Failed to parse {value} as {type_name}")
                        continue
            if key == "sample_rate" or key == "center_freq":
                setattr(self, key, float(value))
