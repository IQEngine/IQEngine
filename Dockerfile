# Build step #1: build the React front end
FROM docker.io/node:18-alpine@sha256:58878e9e1ed3911bdd675d576331ed8838fc851607aed3bb91e25dfaffab3267 as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/package*.json ./
RUN npm ci
COPY ./client/public ./public
COPY ./client ./
COPY .en[v] ./
RUN npm run build

# Build step #2: build the API with the client as static files
FROM docker.io/python:3.11@sha256:bc1d76a8360d77a6ab467a8c48ce40369707c9aa76492df094968ce55cca88ae
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
