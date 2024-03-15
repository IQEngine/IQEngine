from abc import ABC, abstractmethod
import inspect
import os
import json

class Plugin(ABC):

    @abstractmethod
    def rf_function(self, samples, job_id=None):
        pass

    def run(self, samples, job_id):
        try:
            result = self.rf_function(samples, job_id)
        except Exception as e:
            self.set_status(job_id, -1, str(e))
        finally:
            self.store_result(job_id, result)
            self.set_status(job_id, 100)

    def set_status(self, job_id, progress, error= None):
        with open(os.path.join("jobs", job_id + ".json"), "r") as f:
            job_status = json.load(f)
            job_status["progress"] = progress
            if error:
                job_status["error"] = error

        with open(os.path.join("jobs", job_id + ".json"), "w") as f:
            f.write(json.dumps(job_status, indent=4))

    def store_result(self, job_id, result):
        if not os.path.isdir("results"):
            os.mkdir("results")

        with open(os.path.join("results", job_id + ".json"), "w") as f:
            f.write(json.dumps(result, indent=4))
    
    def get_definition(self):
        definition = {}
        for i in inspect.getmembers(self):
            if not i[0].startswith('_') and not inspect.ismethod(i[1]):
                if not i[0] == "sample_rate" and not i[0] == "center_freq":
                    print(i)
                    definition[i[0]] = {
                        "title": i[0],
                        "default": i[1],
                        "type": type(i[1]).__name__,
                        "value": i[1]
                    }
        return definition