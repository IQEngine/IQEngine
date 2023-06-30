#!/bin/bash

# export the following before running tests
# export MONGO_USERNAME=somebody
# export MONGO_PASSWORD=something
#
# This connection string is for IQEngine to use for connecting to
# the database. It's connecting from its own container to Mongo
# in its container. Hence, it uses iqenginedb:27017 as the url.
#
# Test for the name/pw
if [[ -z "$MONGO_USERNAME" ]]; then
  echo "MONGO_USERNAME must be set."
  exit
fi
if [[ -z "$MONGO_PASSWORD" ]]; then
  echo "MONGO_PASSWORD must be set."
  exit
fi

# runs from e2e folder because that's where the playwright
# config files are
cd .. || exit
docker compose -f docker-compose-e2e.yml up --build
cd e2e || exit
