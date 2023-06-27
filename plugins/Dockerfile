# Debian's bookworm has GNU Radio 3.10.5 already built
FROM docker.io/debian:bookworm-slim
LABEL org.opencontainers.image.description="Plugins for IQEngine to provide additional post processing capabilities"
LABEL org.opencontainers.image.licenses=MIT
# Leave gnuradio as its own line, and have it be first, because it takes forever to build
RUN apt-get update && apt-get install gnuradio -y
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6 -y
# Note that GNU Radio has a bunch of python3-xyz deps so we'll install the rest of the python
#    packages with apt instead of pip
RUN apt-get install python3-fastapi uvicorn -y
RUN apt-get install python3-opencv -y
WORKDIR /src
COPY src ./
EXPOSE 8000
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "plugins_api:app"]
