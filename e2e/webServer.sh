#!/bin/bash

# export the following before running tests
# export MONGO_INITDB_ROOT_USERNAME=somebody
# export MONGO_INITDB_ROOT_PASSWORD=something
#
# This connection string is for IQEngine to use for connecting to
# the database. It's connecting from its own container to Mongo
# in its container. Hence, it uses rfdxdb:27017 as the url.
#
# Test for the name/pw
if [[ -z "$MONGO_INITDB_ROOT_USERNAME" ]]; then
  echo "MONGO_INITDB_ROOT_USERNAME must be set."
  exit
fi
if [[ -z "$MONGO_INITDB_ROOT_PASSWORD" ]]; then
  echo "MONGO_INITDB_ROOT_PASSWORD must be set."
  exit
fi

# runs from e2e folder because that's where the playwright config files are
cd .. || exit
conn="mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@rfdxdb:27017/admin"
docker build -t iqengine .
docker network create rfdxnet
docker run --network rfdxnet -p 27017:27017 -d \
  -e MONGO_INITDB_ROOT_USERNAME=$MONGO_INITDB_ROOT_USERNAME \
  -e MONGO_INITDB_ROOT_PASSWORD=$MONGO_INITDB_ROOT_PASSWORD \
  --name rfdxdb \
  mongo:latest
docker run --network rfdxnet -p 3000:3000 \
  -e RFDX_FF_INMEMDB=0 \
  -e VITE_FEATURE_FLAGS='{"useAPIDatasources": true}' \
  -e IQENGINE_METADATA_DB_CONNECTION_STRING=$conn \
  --name iqengine \
  iqengine:latest

cd e2e || exit
