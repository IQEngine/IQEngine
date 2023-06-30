export const ofdm = {
  label: 'OFDM with CP and Pilots',
  value: `\
import numpy as np
import matplotlib.pyplot as plt
from scipy.signal import resample

# Adapted from https://dspillustrations.com/pages/posts/misc/python-ofdm-example.html

N = 10000 # number of samples to simulate
K = 64 # number of OFDM subcarriers
CP = K//4 # length of the cyclic prefix: 25% of the block
P = 8 # number of pilot carriers per OFDM block
SNRdb = 30 # signal to noise-ratio in dB at the receiver
bits_per_symbol = 2 # bits per symbol (i.e. QPSK)

num_OFDM_symbols = int(np.floor(N/(K+CP)))
allCarriers = np.arange(K)  # indices of all subcarriers ([0, 1, ... K-1])
pilotCarriers = allCarriers[::K//P] # Pilots is every (K/P)th carrier.
dataCarriers = np.delete(allCarriers, pilotCarriers)

mapping_table = {
    (0,0) : 1+1j,
    (0,1) : 1-1j,
    (1,0) : -1+1j,
    (1,1) : -1-1j,
}

x = np.empty(1, dtype=np.complex64)
for i in range(num_OFDM_symbols):
    bits = np.random.binomial(n=1, p=0.5, size=(len(dataCarriers)*bits_per_symbol, )) # number of payload bits per OFDM symbol
    bits_per_subcarrier = bits.reshape((len(dataCarriers), bits_per_symbol))
    QAM_payload = np.array([mapping_table[tuple(b)] for b in bits_per_subcarrier])

    OFDM_symbol = np.zeros(K, dtype=complex) # the overall K subcarriers
    OFDM_symbol[pilotCarriers] = 1+1j # allocate the pilot subcarriers with known value
    OFDM_symbol[dataCarriers] = QAM_payload # allocate the pilot subcarriers
    OFDM_time = np.fft.ifft(OFDM_symbol)

    cp = OFDM_time[-CP:] # take the last CP samples ...
    OFDM_time = np.hstack([cp, OFDM_time]) # ... and add them to the beginning
    x = np.concatenate((x, OFDM_time)) # add OFDM symbol to samples array

x = resample(x, len(x) * 2) # interpolate OFDM signal 2x

# Apply channel impulse response
channelResponse = np.array([1, 0, 0.352+0.164j]) # example impulse response of a wireless channel
x = np.convolve(x, channelResponse, 'valid')
signal_power = np.mean(abs(x**2))
sigma2 = signal_power * 10**(-SNRdb/10) # calculate noise power based on signal power and SNR

# Generate complex noise with given variance
noise = np.sqrt(sigma2/2) * (np.random.randn(len(x))+1j*np.random.randn(len(x)))
x = x + noise

x = x.astype(np.complex64)
`,
};
