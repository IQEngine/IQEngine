# Build step #1: build the React front end
FROM docker.io/node:22-alpine@sha256:9fcc1a6da2b9eee38638df75c5f826e06e9c79f6a0f97f16ed98fe0ebb0725c0 as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/package*.json ./
RUN npm ci
COPY ./client/public ./public
COPY ./client ./
COPY .en[v] ./
RUN npm run build

# Build step #2: build the API with the client as static files
FROM docker.io/python:3.12@sha256:c64795dce5347ac23ba30626dd397e1a82c14f7679b4c205a914e767334ea024
LABEL org.opencontainers.image.description="IQEngine is a container image that provides a concise and efficient visualization and exploration tool for RF data in the SIGMF format."
LABEL org.opencontainers.image.licenses=MIT
WORKDIR /app
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r ./requirements.txt
COPY api ./
COPY .en[v] ./
COPY --from=build-step /app/build ./iqengine
EXPOSE 3000
CMD uvicorn --host 0.0.0.0 --port 3000 --workers 1 main:app
