# Copyright (c) 2023 Marc Lichtman.
# Licensed under the MIT License.

import base64
import numpy as np
from pydantic.dataclasses import dataclass
from gnuradio import filter
from gnuradio.filter import firdes
from gnuradio import gr
from gnuradio.fft import window
from gnuradio import zeromq
import zmq


class gnuradio_lowpass_filter(gr.top_block):
    def __init__(self, sample_rate, cutoff, width):
        gr.top_block.__init__(self, "GNU Radio-based IQEngine Plugin", catch_exceptions=True)
        self.zmq_sub_source = zeromq.sub_source(gr.sizeof_gr_complex, 1, 'tcp://127.0.0.1:5001', 100, False, -1)
        self.zmq_pub_sink = zeromq.pub_sink(gr.sizeof_gr_complex, 1, 'tcp://127.0.0.1:5002', 100, False, -1)
        self.filter = filter.fir_filter_ccf(1, firdes.low_pass(1, sample_rate, cutoff, width, window.WIN_HAMMING, 6.76))
        self.connect(self.filter, self.zmq_pub_sink)
        self.connect(self.zmq_sub_source, self.filter)


@dataclass
class Plugin:
    sample_rate: int = 0
    center_freq: int = 0

    # custom params
    cutoff: float = 1e6  # relative to sample rate
    width: float = 0.1e6  # relative to sample rate

    def run(self, samples):
        # create a PUB socket
        context = zmq.Context()
        pub_socket = context.socket(zmq.PUB)
        pub_socket.bind('tcp://*:5001')
        print("started python PUB")

        tb = gnuradio_lowpass_filter(self.sample_rate, self.cutoff, self.width)
        tb.start()
        print("started flowgraph")

        # create a SUB socket
        sub_socket = context.socket(zmq.SUB)
        sub_socket.connect('tcp://127.0.0.1:5002')
        sub_socket.setsockopt(zmq.SUBSCRIBE, b'') # subscribe to topic of all (needed or else it won't work)
        sub_socket.setsockopt(zmq.RCVTIMEO, 500) # may have to increase if its a slow flowgraph
        print("started python SUB")

        # for now just send entire batch of samples at once, we'll figure out what the limits are later
        pub_socket.send(samples.tobytes())
        print("sent samples")

        newSamples = np.empty(0, dtype=np.complex64)
        while True:
            try:
                resp = sub_socket.recv()
                newSamples = np.concatenate((newSamples, np.frombuffer(resp, dtype=np.complex64, count=-1)))
            except Exception as e: # messy way of figuring out when gnuradio is done
                print(e)
                break

        tb.stop()
        tb.wait()
        samples_obj = {
            "samples": base64.b64encode(newSamples),
            "sample_rate": self.sample_rate,
            "center_freq": self.center_freq,
            "data_type": "iq/cf32_le",
        }
        return {"status": "SUCCESS", "data_output": [samples_obj], "annotations": []}
