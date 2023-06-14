# Integration Tests

## Setup

Install Playwright with the following, tested to work on Ubuntu 22:

```bash
npm install playwright
npx playwright install
sudo apt-get install libflite1
(probably more installs needed to get all browsers in the list working)
```

## Run

First, run an instance of the site locally, e.g. with `make dev` which will run it on <http://localhost:3000>

Integration testing is implemented using a couple of tools. For the api, pytest is the tool. For the frontend, the tool is [Playwright](https://playwright.dev/docs/intro).

There are several ways to run the tests:

1. ```npx playwright test (with optional pattern)```
2. ```make test``` (runs playwright and pytest unit tests)
3. ```make test-pw```  (runs only the playwright tests)
4. In VSCode, the Playwright extension has run script features as well as several others.

If you're using #1, the (pattern) is the usual - a substring, filename pattern and so on.

If you're using VSCode, here's a little more on the [extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright):

<p align="center">
  <img width=500 src="../client/public/vscode-pw-test-runner.png" />
</p>

The highlighted controls trigger running a script, a collection of scripts, debugging of scripts, and so on.
