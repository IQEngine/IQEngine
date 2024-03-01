# Build step #1: build the React front end
FROM docker.io/node:20-alpine@sha256:c0a3badbd8a0a760de903e00cedbca94588e609299820557e72cba2a53dbaa2c as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/package*.json ./
RUN npm ci
COPY ./client/public ./public
COPY ./client ./
COPY .en[v] ./
RUN npm run build

# Build step #2: build the API with the client as static files
FROM docker.io/python:3.12@sha256:e83d1f4d0c735c7a54fc9dae3cca8c58473e3b3de08fcb7ba3d342ee75cfc09d
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
