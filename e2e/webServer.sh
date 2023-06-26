#!/bin/bash

# runs from e2e folder
cd .. || exit
docker build -t iqengine .
docker run -p 3000:3000 -e RFDX_FF_INMEMDB=0 -e IQENGINE_FEATURE_FLAGS='{"useAPIDatasources": true}' iqengine:latest
cd e2e || exit
