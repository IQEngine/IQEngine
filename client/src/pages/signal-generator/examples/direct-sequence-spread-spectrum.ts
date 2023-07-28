export const directSequenceSpreadSpectrum = {
  label: 'Direct-Sequence Spread Spectrum',
  value: `\
import numpy as np
import matplotlib.pyplot as plt
import time

num_data_bits = 1000

gold_code_len = 31 # is also the spreading gain, aka processing gain
print(10*np.log10(gold_code_len)) # spreading gain in dB
gold_code = np.array([-1, -1, 1, -1, -1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 1, 1, -1, 1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, 1, -1, 1])

# slow BPSK symbol, no pulse shaping
bpsk_rect = np.random.randint(0, 2, size=num_data_bits) * 2 - 1 # 1's and -1's
bpsk_rect = np.repeat(bpsk_rect, gold_code_len)

dsss = np.tile(gold_code, num_data_bits) * bpsk_rect

noise = np.random.randn(len(dsss)) + 1j*np.random.randn(len(dsss))

x = dsss + noise
#x = bpsk_rect + dsss + noise
`,
};
