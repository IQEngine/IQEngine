#!/bin/bash

cd ..
docker build -t iqengine .
docker run -p 3000:3000 -e RFDX_FF_INMEMDB=1 iqengine:latest
