# Build step #1: build the React front end
FROM docker.io/node:18-alpine as build-step
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY client/package*.json ./
RUN npm ci
COPY ./client/public ./public
COPY ./client ./
COPY .en[v] ./
RUN npm run build

# Build step #2: build the API with the client as static files
FROM docker.io/python:3.10
LABEL org.opencontainers.image.source="https://github.com/IQEngine/IQEngine"
WORKDIR /app
COPY api/requirements.txt ./
RUN pip install -r ./requirements.txt
COPY api ./
COPY .en[v] ./
COPY --from=build-step /app/build ./build
ENV FLASK_ENV production
EXPOSE 3000
CMD ["gunicorn", "-b", ":3000", "api:app"]