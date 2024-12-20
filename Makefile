.PHONY: setup run-api run-react build-docker run-docker clean dev test lint lint-corrections lint-no-corrections all test test-pw build-infra deploy-infra

setup:
	@echo "Setting up project dependencies..."
	@pip install -r api/requirements.txt
	@pip install -r plugins/src/requirements.txt
	@npm install --prefix ./client

run-api:
	@echo "Running FastAPI on port 5000..."
	@cd api && IN_MEMORY_DB=1 && python3 -m uvicorn --port 5000 main:app

run-react:
	@echo "Running React application on port 3000..."
	@cd client && npm run start

run-plugins:
	@echo "Running plugins backend on port 8000..."
	@cd plugins/src && uvicorn plugins_api:app --reload

run-docker:
	@echo "Building and Running IQEngine Docker container..."
	@docker-compose -f docker-compose-dev.yml up

run-docker-rebuild:
	@echo "Building and Running IQEngine Docker container..."
	@docker-compose -f docker-compose-dev.yml up --build --force-recreate --no-deps

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

dev-prod:
	@echo "Running React application for debugging..."
	@cd client && npm run build && npm run preview

test:
	@echo "Running Playwright frontend and end-to-end tests"
	@cd e2e && npx playwright test
	@e2e/teardown.sh
	@echo "Running pytest api tests"
	@cd api && pytest

test-pw:
	@echo "NOTE- you must have make dev and make run-api running to use this"
	@echo "Running Playwright frontend and end-to-end tests"
	@cd e2e && npx playwright test --config playwright-pr.config.ts --grep @CICompatible
	@e2e/teardown.sh

test-pw-prod:
	@echo "Running Playwright frontend and end-to-end tests"
	@cd e2e && npx playwright test --config playwright-prod.config.ts
	@e2e/teardown.sh

test-pw-staging:
	@echo "Running Playwright frontend and end-to-end tests"
	@cd e2e && npx playwright test --config playwright-staging.config.ts
	@e2e/teardown.sh

test-api:
	@echo "Running pytest api tests"
	@cd api && pytest

test-client:
	@echo "Running client unit tests"
	@cd client && npm run test

lint-corrections:
	@echo "Linting with megalinter and applying corrections..."
	@docker run -v $(shell git rev-parse --show-toplevel):/tmp/lint ghcr.io/oxsecurity/megalinter-cupcake:v7.1.0

lint-no-corrections:
	@echo "Linting with megalinter..."
	@docker run -e APPLY_FIXES=none -v $(shell git rev-parse --show-toplevel):/tmp/lint ghcr.io/oxsecurity/megalinter-cupcake:v7.1.0

black:
	@echo "Running black on api and plugins"
	@cd api && black --line-length 150 .
	@cd plugins/src && black --line-length 150 .
