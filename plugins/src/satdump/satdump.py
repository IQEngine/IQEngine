import base64

import numpy as np
from pydantic.dataclasses import dataclass
from scipy import signal
from scipy.io.wavfile import write
import io
import json
import random
import string
import os
import fastapi
import shutil
import subprocess
import time

'''
Usage : satdump [pipeline_id] [input_level] [input_file] [output_file_or_directory] [additional options as required]
Extra options (examples. Any parameter used in modules can be used here) :
  --samplerate [baseband_samplerate] --baseband_format [f32/s16/s8/u8] --dc_block --iq_swap
Sample command :
satdump metop_ahrpt baseband /home/user/metop_baseband.s16 metop_output_directory --samplerate 6e6 --baseband_format s16

List of pipelines and args - https://github.com/SatDump/SatDump/blob/master/docs/Satellite-pipelines.md
'''

@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    pipeline_id: str = '' # aqua_db, terra_db, aura_db, noaa_hrpt

    def run(self, x: np.ndarray):
        # TODO: use a ramdisk instead or something similar where its kept in memory, or figure out how to feed the live processing mode of satdump
        # Save to a temporary IQ file
        temp_filename = '/tmp/' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)) + '.iq'
        x.tofile(temp_filename)

        time.sleep(0.1) # I don't think any sleep is nessesary, tofile is blocking
        if os.stat(temp_filename).st_size != len(x) * 8:
            raise fastapi.HTTPException(status_code=500, detail="tempfile wasnt the expected size")
        


        temp_output_dir = '/tmp/' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=10)) + '/'
        os.mkdir(temp_output_dir)
        try:
            # Run SatDump
            satdump_cmd = f"satdump {self.pipeline_id} baseband {temp_filename} {temp_output_dir} --samplerate {self.sample_rate} --baseband_format f32"
            print("Running satdump:", satdump_cmd)
            result = subprocess.run([satdump_cmd], shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE) # this is blocking
            logs = result.stdout.decode('utf-8') + result.stderr.decode('utf-8') # for whatever reason all of satdumps output is in stderr
            #print(logs)
            logs += str(list(os.walk(temp_output_dir)))
            
            # Grab SNR (there isn't always one listed, depends how long processing takes)
            snr_start_indx = logs.rfind('Peak SNR: ')
            if snr_start_indx:
                snr_stop_indx = logs[snr_start_indx:].find('\n')
                snr_dB = float(logs[snr_start_indx + 10:snr_start_indx+snr_stop_indx-2].strip()[:-3])
                print(snr_dB)

            # Analyze results directory
            #if self.pipeline_id == 'aqua_db':
                


            # Create wav file out of real samples
            #byte_io = io.BytesIO(bytes())
            #write(byte_io, 48000, x)

            samples_obj = {
                #"samples": base64.b64encode(byte_io.read()),
                #"data_type": "audio/wav",
            }
            
            # Cleanup
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            exit()
            if os.path.exists(temp_output_dir) and os.path.isdir(temp_output_dir):
                shutil.rmtree(temp_output_dir)

            return {"data_output": [samples_obj], "annotations": []}

        except Exception as err:
            print("Error running satdump:", err)
            if os.path.exists(temp_filename):
                os.remove(temp_filename)
            if os.path.exists(temp_output_dir) and os.path.isdir(temp_output_dir):
                shutil.rmtree(temp_output_dir)
            raise fastapi.HTTPException(status_code=500, detail="Error during satdump execution")

# For testing
if __name__ == "__main__":
    #samples = np.fromfile('/mnt/d/Aqua_DB.sigmf-data', dtype=np.complex64, count=int(2e8), offset=0) # minimum to get imagery out for aqua
    #sample_rate = 15e6
    #center_freq = 1360e6
    #params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'pipeline_id': 'aqua_db'}

    samples = np.fromfile('/mnt/d/NOAA_HRPT.sigmf-data', dtype=np.complex64, count=int(2e8), offset=0) # minimum to get imagery out for aqua
    sample_rate = 3e6
    center_freq = 1707e6 # 1698e6 # 1702.5e6
    params = {'sample_rate': sample_rate, 'center_freq': center_freq, 'pipeline_id': 'noaa_hrpt'}



    detector = Plugin(**params)
    ret = detector.run(samples)
    print(ret)


    