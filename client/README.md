# IQEngine Frontend

This is the frontend for IQEngine. It is a React app that connects to the backend API and it is responsible for the UI and the user experience.

## Running the frontend

To run the frontend, you need to have Node.js installed. Then, you can run the following commands:

```bash
cd client
npm install
npm start
```

This will start the frontend on port 3000. You can then access it by going to <http://localhost:3000>.
This is assuming that you have the backend from [../api](../api) running on port 5000.

## Building the frontend

To build the frontend, you can run the following commands:

```bash
cd client
npm install
npm run build
```

This will create a `build` folder with the static files that can be served by a web server.

## Development

### Folder structure

The organization of the file structure it is heavily inspired by the [Web dev simplified article](https://blog.webdevsimplified.com/2022-07/react-folder-structure/) on how to structure a React project.

The frontend is organized in the following folders:

- `public`: Contains the static files that are served by the web server.
- `src`: Contains the source code of the frontend.
  - `features`: Contains the features and components that are used across multiple pages.
    - `<feature-name>` Contains the React components that are used to build the feature with the name `<feature name>`.
      - `components`: Contains the React components that are used to build the feature with the name `<feature name>`.
      - `hooks`: Contains the React hooks that are used to build the feature with the name `<feature name>`.
    - `ui`: Contains the React components that are used to build the UI of the app.
  - `pages`: Contains the React components that are used to build the pages of the app.
    - `<page-name>`: Contains the React components that are used to build the page with the name `<page name>`.
      - `components`: Contains the React components that are used to build the page with the name `<page name>`.
      - `hooks`: Contains the React hooks that are used to build the page with the name `<page name>`.
  - `api`: Contains the functions and hooks that are used to make API calls to the backend.
    - `<api-area>`: Contains the functions and hooks that are used to make API calls to the backend for the area `<api-area>`.
    - `utils`: Contains utility functions that are used to make API calls to the backend.
  - `utils`: Contains utility functions that are used throughout the app.
  - `mocks`: Contains mock data and methods that are used for testing.
  - `hooks`: Contains the React hooks that are used throughout the app.
  - `data`: Contains the static data that is used throughout the app.
  - `App.tsx`: The main React component of the app.
  - `index.tsx`: The entry point of the app.

### File naming conventions

- All the files are named using `kebab-case`.
- All the folders are named using `kebab-case`.
- All the React components are named using `PascalCase`.
- All the React hooks are named using `usePascalCase`.
- All functions are named using `camelCase`.
- All the variables are named using `camelCase`.
- All the constants are named using `UPPER_SNAKE_CASE`.
- All the types are named using `PascalCase`.
- All the interfaces are named using `PascalCase`.
- All the enums are named using `PascalCase`.
