# Build step #1: build the React front end
FROM docker.io/node:20-alpine@sha256:f62abc08fe1004555c4f28b6793af8345a76230b21d2d249976f329079e2fef2 as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/package*.json ./
RUN npm ci
COPY ./client/public ./public
COPY ./client ./
COPY .en[v] ./
RUN npm run build

# Build step #2: build the API with the client as static files
FROM docker.io/python:3.11@sha256:85b3d192dddbc96588b719e86991e472b390805a754681a38132de1977d8e429
LABEL org.opencontainers.image.description="IQEngine is a container image that provides a concise and efficient visualization and exploration tool for RF data in the SIGMF format."
LABEL org.opencontainers.image.licenses=MIT
WORKDIR /app
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r ./requirements.txt
COPY api ./
COPY .en[v] ./
COPY --from=build-step /app/build ./iqengine
EXPOSE 3000
CMD uvicorn --host 0.0.0.0 --port 3000 --workers $(expr $(nproc) \* 2 + 1) main:app
