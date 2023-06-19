FROM docker.io/python:3.10
LABEL org.opencontainers.image.description="Plugins for IQEngine to provide additional post processing capabilities"
LABEL org.opencontainers.image.licenses=MIT
COPY src ./src
WORKDIR /src
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y && find . -name 'requirements.txt' -exec pip3 install --no-cache-dir -r {} \;
EXPOSE 8000
CMD ["uvicorn", "--host", "0.0.0.0", "--port", "8000", "plugins_api:app"]
