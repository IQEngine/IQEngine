from converters.vita49_to_sigmf import vita49
import os
import json
import numpy as np
from numpy.testing import assert_allclose

def test_vita49_converter():
    # dont include the .sigmf extension in 2nd arg, it will get added
    vita49.convert_input('converters/vita49_to_sigmf/example.vita49', 'example_out')
    # Read in meta file
    with open('example_out0x0.sigmf-meta') as f:
        data = json.load(f)
    samples = np.fromfile('example_out0x0.sigmf-data', dtype=np.complex64)
    assert os.path.getsize('example_out0x0.sigmf-data') == 1928496
    assert len(samples) == 241062
    assert_allclose(samples[0], (0.19556262 + 0.029114658j), rtol=1e-5)
    assert_allclose(samples[-1], (0.051026948 - 0.09524827j), rtol=1e-5)
    assert data['global']['core:datatype'] == 'cf32_le'
    assert data['global']['core:sample_rate'] == 40e6
    assert len(data['captures']) == 666
    os.remove('example_out0x0.sigmf-data')
    os.remove('example_out0x0.sigmf-meta')
