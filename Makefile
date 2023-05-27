.PHONY: setup run-api run-react build-docker run-docker clean run-dev lint lint-corrections lint-no-corrections all test

setup:
	@echo "Setting up project dependencies..."
	@pip install -r api/requirements.txt
	@npm install --prefix ./client

run-api:
	@echo "Running Flask API on port 5000..."
	@cd api && flask run

run-react:
	@echo "Running React application on port 3000..."
	@cd client && npm run start

build-docker:
	@echo "Building Docker image for IQEngine..."
	@docker build -t iqengine .

run-docker:
	@echo "Running IQEngine Docker container..."
	@docker run -p 5000:5000 -p 3000:3000 iqengine

clean:
	@echo "Cleaning up..."
	@rm -rf api/__pycache__
	@rm -rf client/node_modules
	@rm -rf client/build

dev:
	@echo "Running Flask API and React application for debugging..."
	@cd api && flask run &
	@cd client && npm run start


lint:
	@echo "Do you want to lint to correct the files? [y/N] " && read ans && if [ $${ans:-'N'} = 'y' ]; then make lint-corrections; else make lint-no-corrections;fi

lint-corrections:
	@echo "Linting with megalinter and applying corrections..."
	@docker run -v $(shell git rev-parse --show-toplevel):/tmp/lint ghcr.io/oxsecurity/megalinter:v6

lint-no-corrections:
	@echo "Linting with megalinter..."
	@docker run -e APPLY_FIXES=none -v $(shell git rev-parse --show-toplevel):/tmp/lint ghcr.io/oxsecurity/megalinter:v6
