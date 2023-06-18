export const bpskToneNoise = {
  label: 'BPSK + Tone + Noise',
  value: `\
import numpy as np
import matplotlib.pyplot as plt
import time

# For a guide on DSP in Python check out www.pysdr.org

N = 102400 # number of samples to simulate
t = np.arange(N)
tone = np.exp(2j*np.pi*0.15*t) # tone
start_t = time.time() # measure how long this code takes

sps = 8
num_symbols = int(N/sps)
bits = np.random.randint(0, 2, num_symbols) # Our data to be transmitted, 1's and 0's
bpsk = np.array([])
for bit in bits:
    pulse = np.zeros(sps)
    pulse[0] = bit*2-1 # set the first value to either a 1 or -1
    bpsk = np.concatenate((bpsk, pulse)) # add the 8 samples to the signal
num_taps = 101 # for our RRC filter
beta = 0.35
t = np.arange(num_taps) - (num_taps-1)//2
h = np.sinc(t/sps) * np.cos(np.pi*beta*t/sps) / (1 - (2*beta*t/sps)**2)
bpsk = np.convolve(bpsk, h) # Filter our signal, in order to apply the pulse shaping
bpsk = bpsk[0:N] # bspk will be a few samples too long because of pulse shaping filter

noise = np.random.randn(N) + 1j*np.random.randn(N)

x = tone + bpsk + 0.1*noise

print("elapsed time:", (time.time() - start_t)*1e3, 'ms')
`,
};
