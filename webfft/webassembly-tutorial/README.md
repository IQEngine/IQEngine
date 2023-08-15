# Setting up emscripten toolchain

```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
 ```

## Building the module

```bash
cd emsdk
source ./emsdk_env.sh
cd to this repo
make
serve -l 8080
```
