#!/bin/bash

# runs from e2e folder
cd .. || exit
docker build -t iqengine .
docker run -p 3000:3000 -e IN_MEMORY_DB=0 -e VITE_FEATURE_FLAGS='{"useAPIDatasources": true}' iqengine:latest
cd e2e || exit
