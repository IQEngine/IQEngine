#!/bin/bash

docker kill iqengine
docker kill iqenginedb
docker network rm iqenginenet
docker container prune --force
