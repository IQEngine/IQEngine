import argparse
import numpy as np
import math
import time
import datetime
import sigmf
from sigmf import SigMFFile
from sigmf.utils import get_data_type_str
from pathlib import Path

def save_to_sigmf(samples, frequency: float, meta_dict:dict={}):
    ###folder / file handling
    now = datetime.datetime.now()
    time = now.strftime("%H%M%S")
    Path("recordings").mkdir(exist_ok=True)
    folder = Path("recordings")
    filename = f"synth_iq_scene_{int(int(frequency) / 1000000)}MHz{time}"
    fullpath = folder / filename

    # Save data file
    samples.tofile(f'{fullpath}.sigmf-data')

    # create the metadata
    meta = SigMFFile(
        data_file=f'{fullpath}.sigmf-data',  # extension is optional
        global_info={
            SigMFFile.DATATYPE_KEY: 'cf32_le',  # get_data_type_str(samples),
            SigMFFile.SAMPLE_RATE_KEY: int(meta_dict["sample_rate"]),
            SigMFFile.AUTHOR_KEY: meta_dict["author"],
            SigMFFile.DESCRIPTION_KEY: meta_dict["description"],
            SigMFFile.VERSION_KEY: sigmf.__version__,
            SigMFFile.HW_KEY: meta_dict["sdr"],
        }
    )

    # create a capture key at time index 0
    meta.add_capture(0, metadata={
        SigMFFile.FREQUENCY_KEY: meta_dict["center_freq"],
        SigMFFile.DATETIME_KEY: datetime.datetime.utcnow().isoformat() + 'Z',
        SigMFFile.GLOBAL_INDEX_KEY: 0
    })

    # meta.add_annotation(0, int(meta_dict["rec_length"]), metadata = {
    #     # SigMFFile.FLO_KEY: meta_dict["flo"],
    #     # SigMFFile.FHI_KEY: meta_dict["fhi"],
    #     SigMFFile.LABEL_KEY: meta_dict["label"],
    #     SigMFFile.COMMENT_KEY: meta_dict["comment"],
    # })

    meta.tofile(f'{fullpath}.sigmf-meta') 

# NOTE, the symbols and pulse shaping were generated via the ChatGPT LLM.

def add_noise(symbols, variance=0.1):
    noise = np.sqrt(variance) * (np.random.randn(symbols.size) + 1j * np.random.randn(symbols.size))
    return symbols + noise

def generate_bpsk_symbols(num_symbols, variance=0.1):
    symbols = np.random.choice([1, -1], num_symbols)
    return add_noise(symbols, variance)

def generate_qpsk_symbols(num_symbols, variance=0.1):
    symbols = np.random.choice([1 + 1j, 1 - 1j, -1 + 1j, -1 - 1j], num_symbols)
    return add_noise(symbols, variance)

def generate_8psk_symbols(num_symbols, variance=0.1):
    angles = np.linspace(0, 2 * np.pi, 8, endpoint=False)
    symbols = np.exp(1j * angles[np.random.randint(8, size=num_symbols)])
    return add_noise(symbols, variance)

def generate_pam4_symbols(num_symbols, variance=0.1):
    symbols = np.random.choice(np.linspace(-3, 3, 4), num_symbols)
    return add_noise(symbols, variance)

def generate_qam16_symbols(num_symbols, variance=0.1):
    re_vals = np.array([-1.5, -0.5, 0.5, 1.5]) / np.sqrt(10)
    im_vals = np.array([-1.5, -0.5, 0.5, 1.5]) / np.sqrt(10)
    symbols = np.random.choice(re_vals, num_symbols) + 1j * np.random.choice(im_vals, num_symbols)
    return add_noise(symbols, variance)

def generate_qam64_symbols(num_symbols, variance=0.1):
    re_vals = np.array([-7, -5, -3, -1, 1, 3, 5, 7]) / np.sqrt(42)
    im_vals = np.array([-7, -5, -3, -1, 1, 3, 5, 7]) / np.sqrt(42)
    symbols = np.random.choice(re_vals, num_symbols) + 1j * np.random.choice(im_vals, num_symbols)
    return add_noise(symbols, variance)

def generate_qam256_symbols(num_symbols, variance=0.1):
    re_vals = np.array([-15, -13, -11, -9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15]) / np.sqrt(170)
    im_vals = np.array([-15, -13, -11, -9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15]) / np.sqrt(170)
    symbols = np.random.choice(re_vals, num_symbols) + 1j * np.random.choice(im_vals, num_symbols)
    return add_noise(symbols, variance)

generate_functions = {'bpsk':generate_bpsk_symbols,'qpsk':generate_qpsk_symbols,'8psk':generate_8psk_symbols,'pam4': generate_pam4_symbols ,'qam16':generate_qam16_symbols,'qam64':generate_qam64_symbols, "qam256":generate_qam256_symbols}

def add_noise_floor(signal, noise_floor_db=-100):
    signal_power = np.mean(np.abs(signal)**2)
    noise_power = signal_power * 10**(noise_floor_db/10) 
    noise = np.sqrt(noise_power) * (np.random.randn(*signal.shape) + 1j * np.random.randn(*signal.shape)) / np.sqrt(2)
    return signal + noise


def raised_cosine(t, beta, T):
    if beta == 0:
        rc = np.sinc(t / T)
    else:
        rc = (np.sinc(t / T) * np.cos(np.pi * beta * t / T)) / (1 - (2 * beta * t / T)**2)
    return rc

def generate_signal(mod_type, num_symbols, samples_per_symbol, fc, variance=0.01, beta=0.3, pct=10):
    num_transmit_symbols = int(num_symbols * pct / 100)
    symbols = generate_functions[mod_type](num_transmit_symbols, variance)

    baseband_sequence = np.zeros(num_symbols, dtype=complex)

    num_groups = np.random.randint(5, num_transmit_symbols/10)
    group_endpoints = sorted([np.random.randint(1, num_transmit_symbols) for _ in range(num_groups-1)])
    group_endpoints = [0] + group_endpoints + [num_transmit_symbols]

    last_end_pos = 0

    for i in range(num_groups):
        group_length = group_endpoints[i+1] - group_endpoints[i]
        remaining_symbol_length = group_endpoints[-1] - group_endpoints[i+1]
        remaining_tape_length = len(baseband_sequence) - last_end_pos
        useful_whitespace_length = remaining_tape_length - remaining_symbol_length
      
        #0.5 forces it in the first fifth of remaining possible spaces, sqrt adds a distribution
        bias = np.sqrt(np.random.rand())
        start_pos = np.random.randint(last_end_pos,last_end_pos+math.ceil(0.2*bias*(useful_whitespace_length-group_length)))
        end_pos = start_pos + group_length
        
        baseband_sequence[start_pos:end_pos] = symbols[group_endpoints[i]:group_endpoints[i+1]]
        last_end_pos = end_pos
      
    # # no pulse shaping. Uncomment then comment the below if no pulse shaping is desired.
    # t = np.arange(0, num_symbols * samples_per_symbol)
    # baseband_signal = np.repeat(baseband_sequence, samples_per_symbol)
    # carrier = np.exp(1j * 2 * np.pi * fc * t / samples_per_symbol)

    # with pulse shaping. Comment and uncomment the above to remove pulse shaping. 
    t_rc = np.linspace(-samples_per_symbol, samples_per_symbol, 2*samples_per_symbol + 1)
    rc_pulse = raised_cosine(t_rc, beta, samples_per_symbol)
    baseband_signal = np.convolve(np.repeat(baseband_sequence, samples_per_symbol), rc_pulse, mode='same')

    t = np.arange(0, num_symbols * samples_per_symbol)
    carrier = np.exp(1j * 2 * np.pi * fc * t / samples_per_symbol)

    generated_signal = baseband_signal * carrier

    generated_signal= add_noise_floor(generated_signal, noise_floor_db=-100)

    return generated_signal

def synth_logiq(args):

    spslist = [10, 20, 30, 50]
    fclist = [x for x in range(-6,7,1)]
    modslist = ['bpsk','qpsk','8psk','pam4','qam16','qam64','qam256']
    n_signals = np.random.randint(1,args.max_n_signals)
    signals = []

    
    description =''
    comment =''

    for i in range(n_signals):
        amplitude = float(np.random.randint(10,100))/100
        pct = float(np.random.randint(0,70)) # no signal on more than 70% of the time
        sps = np.random.choice(spslist)
        mod_type = np.random.choice(modslist)
        if sps >20:
            fc = np.random.choice(fclist[1:-1])
        else:
            fc = np.random.choice(fclist)
        num_symbols = int(args.num_samples / sps)

        generated_signal = amplitude*generate_signal(mod_type,num_symbols, sps, fc,pct)

        if len(generated_signal)<args.num_samples:
            padding_length = args.num_samples - len(generated_signal)
            generated_signal = np.concatenate([generated_signal, np.zeros(padding_length, dtype=complex)])

        signals.append(generated_signal)
        signal_info_str= f"Signal {i} - Amplitude:{amplitude}, pct:{pct}, sps:{sps}, modulation:{mod_type}, fc: {fc}.   "
        print(signal_info_str)
        description = description +signal_info_str
        comment = comment +f"{mod_type} "


    #add all generated signals together
    signal = sum(signals)

    #add more noise again
    nf_level = -np.random.randint(5,30)
    signal = add_noise_floor(signal, noise_floor_db=nf_level)

    #normalize
    max_magnitude = np.max(np.abs(signal))
    signal = signal / max_magnitude

    label =f'Scene with {n_signals} at {nf_level} dB'


    signal = signal.astype('complex64')
    # print(f"datatype: {signal.dtype}")

    # metadata dictionary for adding to sigmf file
    meta_dict = {
        'author': args.author,
        'center_freq': args.center_freq,
        'description': description, 
        'label': label, #
        'comment': comment, #
        'rec_length': args.num_samples,
        'sdr': "synthetic_sdr",
        'sample_rate': int(args.sample_rate),
        'flo': int(args.center_freq - args.sample_rate/2),
        'fhi': int(args.center_freq + args.sample_rate/2),
    }

    fullpath = save_to_sigmf(signal, args.center_freq, meta_dict)

    return signal

if __name__ == "__main__":
    # add argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--num_samples", "-n",  type=int,   default=2000000, help="Number of samples to capture. Default = 2,000,000")
    parser.add_argument("--center_freq", "-f",  type=float, default=2440e6, help="Center frequency in Hz. Default 2440e6")
    parser.add_argument("--sample_rate", "-r",  type=float, default=20e6, help="Virtual sample rate in Hz, default is 20e6")
    parser.add_argument("--max_n_signals",     "-m",  type=int,   default=9, help="Specify the maximum number of signals prsent in the scene. Default = 9.  NOTE, the total number of signals is randomly chosen to be up to this number.")
    parser.add_argument("--author",     "-a",  type=str,   default="IQ_Engine_User", help=" Author of this scene: Default = IQ_Engine_User")
    args = parser.parse_args()

    synth_logiq(args)


