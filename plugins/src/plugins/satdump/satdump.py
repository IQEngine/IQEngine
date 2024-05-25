import base64
import numpy as np
from pydantic.dataclasses import dataclass
import random
import string
import os
import fastapi
import shutil
import subprocess
import time
from models.plugin import Plugin
from models.models import Output, DataObject

'''
Usage : satdump [pipeline_id] [input_level] [input_file] [output_file_or_directory] [additional options as required]
Extra options (examples. Any parameter used in modules can be used here) :
  --samplerate [baseband_samplerate] --baseband_format [f32/s16/s8/u8] --dc_block --iq_swap
Sample command :
satdump metop_ahrpt baseband /home/user/metop_baseband.s16 metop_output_directory --samplerate 6e6 --baseband_format s16

List of pipelines and args - https://github.com/SatDump/SatDump/blob/master/docs/Satellite-pipelines.md
'''

@dataclass
class satdump(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    pipeline_id: str = 'noaa_apt'  # aqua_db, terra_db, aura_db, noaa_hrpt

    def rf_function(self, samples: np.ndarray, job_context=None):
        print("starting")

        print(len(samples))
        print(samples[100000])

        # TODO: use a ramdisk instead or something similar where its kept in memory, or figure out how to feed the live processing mode of satdump
        # Save to a temporary IQ file
        temp_filename = '/tmp/' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)) + '.iq'
        samples.tofile(temp_filename)
        print("saved file")

        time.sleep(0.1)  # I don't think any sleep is nessesary, tofile is blocking
        # if os.stat(temp_filename).st_size != len(x) * 8:
        #    raise fastapi.HTTPException(status_code=500, detail="tempfile wasnt the expected size")

        temp_output_dir = '/tmp/' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)) + '/'
        os.mkdir(temp_output_dir)
        try:
            # Run SatDump
            satdump_cmd = f"satdump {self.pipeline_id} baseband {temp_filename} {temp_output_dir} --samplerate {self.sample_rate} --baseband_format f32"
            satdump_cmd += ' --freq_shift -120e3 --satellite_number 15'  # ADDED FOR DEMO, REMOVE LATER OR ADD TO CUSTOM PARAMS
            print("Running satdump:", satdump_cmd)
            result = subprocess.run([satdump_cmd], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)  # this is blocking
            logs = result.stdout.decode('utf-8') + result.stderr.decode('utf-8')  # for whatever reason all of satdumps output is in stderr
            print(logs)  # FIXME these logs need to get to client somehow
            logs += str(list(os.walk(temp_output_dir)))

            # Grab SNR (there isn't always one listed, depends how long processing takes)
            if False:
                snr_start_indx = logs.rfind('Peak SNR: ')
                if snr_start_indx:
                    snr_stop_indx = logs[snr_start_indx:].find('\n')
                    if snr_stop_indx != -1:
                        snr_dB_str = logs[snr_start_indx + 10:snr_start_indx + snr_stop_indx - 2].strip()[:-3].strip()
                        snr_dB = float(snr_dB_str)

            # time.sleep(3) # shouldnt need this

            # Analyze results directory
            #   satdump noaa_hrpt baseband NOAA_HRPT.s16 outputdir --samplerate 2.5e6 --baseband_format s16
            if self.pipeline_id == 'noaa_hrpt':
                final_output = temp_output_dir + 'AVHRR/AVHRR-1.png'  # TODO FIGURE OUT CORRECT ONE
                binary_fc = open(final_output, 'rb').read()
                base64_utf8_str = base64.b64encode(binary_fc).decode('utf-8')

            if self.pipeline_id == 'noaa_apt':
                final_output = temp_output_dir + 'avhrr_3_APT_channel_B.png'
                binary_fc = open(final_output, 'rb').read()
                base64_utf8_str = base64.b64encode(binary_fc).decode('utf-8')

            # Cleanup
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

            if os.path.exists(temp_output_dir) and os.path.isdir(temp_output_dir):
                shutil.rmtree(temp_output_dir)

            output_data = DataObject(data_type="image/png", data=base64_utf8_str)

            return Output(non_iq_output_data=output_data)

        except Exception as err:
            print("Error running satdump:", err)
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            if os.path.exists(temp_output_dir) and os.path.isdir(temp_output_dir):
                shutil.rmtree(temp_output_dir)
            raise fastapi.HTTPException(status_code=500, detail="Error during satdump execution")


# For testing
if __name__ == "__main__":
    # Aqua
    # samples = np.fromfile('/mnt/d/Aqua_DB.sigmf-data', dtype=np.complex64, count=int(2e8), offset=0) # minimum to get imagery out for aqua
    # sample_rate = 15e6
    # center_freq = 1360e6
    # params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'pipeline_id': 'aqua_db'}

    # Terra
    # samples = np.fromfile('/mnt/c/Users/marclichtman/Downloads/Terra_36000000SPS_1262500000Hz.s8', dtype=np.int8)
    # samples = samples.astype(np.float32) / 128
    # samples = samples[::2] + 1j * samples[1::2]
    # print(max(samples))
    # sample_rate = 36e6
    # center_freq = 1262.5e6
    # params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'pipeline_id': 'terra_db'}

    # NOAA noaa_apt
    samples = np.fromfile('/mnt/c/Users/marclichtman/Downloads/recordings/APT_2024-02-03_10-52-34.s16', dtype=np.int16)
    samples = samples.astype(np.float32)
    samples = samples[::2] + 1j * samples[1::2]
    samples /= np.max(np.abs(samples))
    print(max(samples))
    sample_rate = 375000
    center_freq = 137500000
    params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'pipeline_id': 'noaa_apt'}

    detector = Plugin(**params)
    ret = detector.run(samples)
    print(ret)
