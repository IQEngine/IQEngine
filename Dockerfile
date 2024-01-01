# Build step #1: build the React front end
FROM docker.io/node:20-alpine@sha256:9e38d3d4117da74a643f67041c83914480b335c3bd44d37ccf5b5ad86cd715d1 as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/package*.json ./
RUN npm ci
COPY ./client/public ./public
COPY ./client ./
COPY .en[v] ./
RUN npm run build

# Build step #2: build the API with the client as static files
FROM docker.io/python:3.12@sha256:3733015cdd1bd7d9a0b9fe21a925b608de82131aa4f3d397e465a1fcb545d36f
LABEL org.opencontainers.image.description="IQEngine is a container image that provides a concise and efficient visualization and exploration tool for RF data in the SIGMF format."
LABEL org.opencontainers.image.licenses=MIT
WORKDIR /app
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r ./requirements.txt
COPY api ./
COPY .en[v] ./
COPY --from=build-step /app/build ./iqengine
EXPOSE 3000
CMD uvicorn --host 0.0.0.0 --port 3000 --workers $(nproc) main:app
