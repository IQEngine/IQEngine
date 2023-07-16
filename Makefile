.PHONY: setup run-api run-react build-docker run-docker clean dev test lint lint-corrections lint-no-corrections all test test-pw build-infra deploy-infra

setup:
	@echo "Setting up project dependencies..."
	@pip install -r api/requirements.txt
	@npm install --prefix ./client

run-api:
	@echo "Running FastAPI on port 5000..."
	@cd api && IN_MEMORY_DB=1 && uvicorn --port 5000 main:app

run-react:
	@echo "Running React application on port 3000..."
	@cd client && npm run start

run-plugins:
	@echo "Running plugins backend on port 8000..."
	@cd plugins/src && uvicorn plugins_api:app --reload

build-docker:
	@echo "Building Docker image for IQEngine..."
	@docker build -t iqengine .

run-docker:
	@echo "Running IQEngine Docker container..."
	@docker run -p 5000:5000 -p 3000:3000 iqengine

build-infra:
	@echo "Building infrastructure..."
	@bicep build $(shell git rev-parse --show-toplevel)/infra/main.bicep --outfile $(shell git rev-parse --show-toplevel)/infra/iqengine.json

deploy-infra:
	@echo "Deploying infrastructure..."
	@az group create --name iqengine --location uksouth
	@az deployment group create --resource-group iqengine --template-file $(shell git rev-parse --show-toplevel)/infra/iqengine.json

clean:
	@echo "Cleaning up..."
	@rm -rf api/__pycache__
	@rm -rf client/node_modules
	@rm -rf client/build

dev:
	@echo "Running React application for debugging..."
	@cd client && npm run start

test:
	@echo "Running Playwright frontend and end-to-end tests"
	@cd e2e && npx playwright test
	@e2e/teardown.sh
	@echo "Running pytest api tests"
	@cd api && pytest

test-pw:
	@echo "Running Playwright frontend and end-to-end tests"
	@cd e2e && npx playwright test
	@e2e/teardown.sh

lint:
	@echo "Do you want to lint to correct the files? [y/N] " && read ans && if [ $${ans:-'N'} = 'y' ]; then make lint-corrections; else make lint-no-corrections;fi

lint-corrections:
	@echo "Linting with megalinter and applying corrections..."
	@docker run -v $(shell git rev-parse --show-toplevel):/tmp/lint ghcr.io/oxsecurity/megalinter-cupcake:v7.1.0

lint-no-corrections:
	@echo "Linting with megalinter..."
	@docker run -e APPLY_FIXES=none -v $(shell git rev-parse --show-toplevel):/tmp/lint ghcr.io/oxsecurity/megalinter-cupcake:v7.1.0
