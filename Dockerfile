# Build step #1: build the React front end
FROM docker.io/node:20-alpine@sha256:d9d53500783a153234cc47d89a2f9117d1ed4eadf29cbeb46c377d172348aa73 as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/package*.json ./
RUN npm ci
COPY ./client/public ./public
COPY ./client ./
COPY .en[v] ./
RUN npm run build

# Build step #2: build the API with the client as static files
FROM docker.io/python:3.10@sha256:74cdd039dc36f6476dd5dfdbc187830e0c0f760a1bdfc73d186060ef4c4bd78f
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
