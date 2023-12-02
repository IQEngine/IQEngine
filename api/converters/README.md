This directory is for python-based converters, to convert various RF recording formats to SigMF (and maybe even the other way!)

They are used within app/converter_router.py to expose the converters to the IQEngine website, but can also be used directly

This will create the sigmf-data and meta files wherever the wav file was:
```bash
cd iqengine
python api/converters/wav_to_sigmf.py test.wav
```
