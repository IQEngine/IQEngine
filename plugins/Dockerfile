# Debian's bookworm has GNU Radio 3.10.5 already built
FROM ghcr.io/iqengine/iqengine-plugins-base:latest
LABEL org.opencontainers.image.description="Plugins for IQEngine to provide additional post processing capabilities"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /src

# Python stuff
RUN apt-get install python3-full python3-pip -y
COPY src/requirements.txt .
RUN pip3 install -r requirements.txt --break-system-packages

COPY src .

EXPOSE 8000
CMD uvicorn --host 0.0.0.0 --port 8000 --workers $(expr $(nproc) \* 2 + 1) plugins_api:app
