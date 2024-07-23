import base64
import io

import numpy as np
import zmq
from gnuradio import analog, filter, gr, zeromq
from gnuradio.filter import pfb
from models.models import DataObject, Output
from models.plugin import Plugin
from scipy.io.wavfile import write


class flowgraph(gr.top_block):
    def __init__(self, samp_rate):
        gr.top_block.__init__(self, "GNU Radio-based IQEngine Plugin", catch_exceptions=True)

        self.zmq_sub_source = zeromq.sub_source(gr.sizeof_gr_complex, 1, "tcp://127.0.0.1:5001", 100, False, -1)
        self.zmq_pub_sink = zeromq.pub_sink(gr.sizeof_float, 1, "tcp://127.0.0.1:5002", 100, False, -1)
        self.pfb_arb_resampler = pfb.arb_resampler_ccf(500e3 / samp_rate, taps=[], flt_size=32)
        self.analog_wfm_rcv = analog.wfm_rcv(quad_rate=500e3, audio_decimation=10)
        self.rational_resampler = filter.rational_resampler_fff(interpolation=50, decimation=48, taps=[], fractional_bw=0)

        self.connect(self.zmq_sub_source, self.pfb_arb_resampler)
        self.connect(self.pfb_arb_resampler, self.analog_wfm_rcv)
        self.connect(self.analog_wfm_rcv, self.rational_resampler)
        self.connect(self.rational_resampler, self.zmq_pub_sink)


class fm_receiver_gnuradio(Plugin):
    sample_rate: int = 0
    center_freq: int = 0

    def rf_function(self, samples, job_context=None):
        # create a PUB socket
        context = zmq.Context()
        pub_socket = context.socket(zmq.PUB)
        pub_socket.bind("tcp://*:5001")
        print("started python PUB")

        tb = flowgraph(self.sample_rate)
        tb.start()
        print("started flowgraph")

        # create a SUB socket
        sub_socket = context.socket(zmq.SUB)
        sub_socket.connect("tcp://127.0.0.1:5002")
        sub_socket.setsockopt(zmq.SUBSCRIBE, b"")  # subscribe to topic of all (needed or else it won't work)
        sub_socket.setsockopt(zmq.RCVTIMEO, 500)  # may have to increase if its a slow flowgraph
        print("started python SUB")

        # for now just send entire batch of samples at once, we'll figure out what the limits are later
        pub_socket.send(samples.tobytes())
        print("sent samples")

        float_out = np.empty(0, dtype=np.float32)
        while True:
            try:
                resp = sub_socket.recv()
                float_out = np.concatenate((float_out, np.frombuffer(resp, dtype=np.float32, count=-1)))
            except Exception as e:  # messy way of figuring out when gnuradio is done
                print(e)
                break

        tb.stop()
        tb.wait()

        # Create wav file out of real samples
        scaled_float_out = np.int16(float_out / np.max(np.abs(float_out)) * 32767)
        byte_io = io.BytesIO(bytes())
        write(byte_io, 48000, scaled_float_out)

        output_data = DataObject(data_type="audio/wav", file_name="output.wav", data=base64.b64encode(byte_io.getvalue()).decode())
        return Output(non_iq_output_data=output_data)
