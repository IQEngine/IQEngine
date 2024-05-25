import base64
from models.plugin import Plugin
from models.models import Output, MetadataFile

class gain_stage(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    gain: float = 1

    def rf_function(self, samples, job_context=None):
        samples = samples * self.gain

        samples_bytes = samples.tobytes()
        samples_b64 = base64.b64encode(samples_bytes).decode()

        metadata = MetadataFile(file_name=job_context.file_name,
                                data_type="iq/cf32_le",
                                sample_rate=self.sample_rate,
                                center_freq=self.center_freq,
                                )

        return Output(metadata_file=metadata, output_data=samples_b64)
