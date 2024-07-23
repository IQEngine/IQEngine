#!/bin/bash

# Check if the additional requirements file exists
if [ -f "additional_requirements.txt" ]; then
  echo "Installing additional requirements..."
  # If it does, install the additional requirements
  pip install -r additional_requirements.txt
fi

# Start your application
uvicorn --host 0.0.0.0 --port 8000 plugins_api:app
