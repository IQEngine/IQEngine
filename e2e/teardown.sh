#!/bin/bash

docker kill iqengine
docker kill rfdxdb
docker network rm rfdxnet
docker container prune --force
