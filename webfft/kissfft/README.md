Build command that worked on Ubuntu 22:

```bash
emcc -O3 -I. \
        --memory-init-file 0 \
        -s NO_FILESYSTEM=1 \
        -s ASSERTIONS=1 \
        -s PRECISE_F32=1 \
        -s MODULARIZE=1 \
        -s EXPORT_NAME="'KissFFTModule'" \
        -s EXPORTED_FUNCTIONS="['_kiss_fftr_alloc','_kiss_fftr','_kiss_fftri','_kiss_fftr_free','_kiss_fft_alloc','_kiss_fft','_kiss_fft_free']" \
        -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall']" \
        -o KissFFT.js \
        kiss_fft.c tools/kiss_fftr.c

TAKE OUT THE ASSERTIONS ONCE EVERYTHING WORKS

rm KissFFT.wasm
```