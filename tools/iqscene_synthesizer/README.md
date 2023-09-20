# Synthetic IQ Scene Generator

Generates a scene of a random number of signals that are modulated, and "transmits" for random periods.

Saves to SigMF.

Prepared for by Qoherent for the IQ Engine project.

## Installation

### Linux

```
python3 -m venv venv
source ./venv/bin/activate
pip install -r requirements.txt

```

### Windows

```
pip install -r requirements.txt
```

# Usage

```
  --num_samples NUM_SAMPLES, -n NUM_SAMPLES
                        Number of samples to capture. Default = 10,000
  --center_freq CENTER_FREQ, -f CENTER_FREQ
                        Center frequency in Hz. Default 2400e6
  --sample_rate SAMPLE_RATE, -r SAMPLE_RATE
                        sample rate in Hz, default is 20e6
  --max_n_signals MAX_N_SIGNALS, -m MAX_N_SIGNALS
                        Specify the maximum number of signals prsent in the scene. Default = 9. Note, the total number of signals is randomly chosen to be up to this number.
  --author AUTHOR, -a AUTHOR
                        Author of this scene: Default = IQ_Engine_User


```


Help:
```
python3 synth_iqscene.py -h 
```

Generate with default settings:
```
python3 synth_iqscene.py
```

Generate with user specified settings:
```
python3 synth_iqscene.py -n 10000000 -f 97000000 -r 18000000 -m 12 -a A_B
```

or

```
python3 synth_iqscene.py --num_samples 10000000 --center_freq 97000000 --sample_rate 18000000 --max_n_signals 12 --author A_B
```

