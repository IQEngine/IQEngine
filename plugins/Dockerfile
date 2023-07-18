# Debian's bookworm has GNU Radio 3.10.5 already built
FROM docker.io/debian:bookworm-slim
LABEL org.opencontainers.image.description="Plugins for IQEngine to provide additional post processing capabilities"
LABEL org.opencontainers.image.licenses=MIT
WORKDIR /src
# Leave gnuradio as its own line, and have it be first, because it takes forever to build
RUN apt-get update && apt-get install gnuradio -y
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y
# Note that GNU Radio has a bunch of python3-xyz deps

# Satdump
RUN apt install git cmake libpng-dev libluajit-5.1-dev libnng-dev libzstd-dev libomp-dev -y
RUN git clone --depth 1 --branch 1.0.3 https://github.com/altillimity/satdump.git
WORKDIR /src/satdump
RUN mkdir build
WORKDIR /src/satdump/build
RUN cmake -DCMAKE_BUILD_TYPE=Release -DBUILD_GUI=OFF -DCMAKE_INSTALL_PREFIX=/usr ..
RUN make -j`nproc`
RUN make install
WORKDIR /src

# Python stuff
RUN apt-get install python3-full python3-pip -y
COPY src/requirements.txt .
RUN pip3 install -r requirements.txt --break-system-packages

COPY src .

EXPOSE 8000
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "plugins_api:app"]
