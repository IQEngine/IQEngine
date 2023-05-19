// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
// import { RedocStandalone } from 'redoc';
// import { redocTheme } from './Utils/redocTheme';
// @ts-ignore
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
// @ts-ignore
import store from './Store/store';
// @ts-ignore
import { About } from './About';
// @ts-ignore
import { SigMF } from './SigMF';
// @ts-ignore
import SignalGenerator from './Components/SignalGenerator/SignalGenerator';
// @ts-ignore
import { Plugins } from './Plugins';
// @ts-ignore
import Validator from './Components/Validator/Validator';
// @ts-ignore
import RepoBrowserContainer from './Containers/RepoBrowserContainer';
// @ts-ignore
import SpectrogramContainer from './Containers/SpectrogramContainer';
// @ts-ignore
import RecordingsListContainer from './Containers/RecordingsListContainer';
// @ts-ignore
import { App } from './App';
import { createRoot } from 'react-dom/client';

// @ts-ignore

var new_version: boolean = false;
// Select wich version to run based on an environment variable
const container = document.getElementById('root');
if (!container) throw new Error('No root element found');
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="about" element={<About />} />
          <Route path="sigmf" element={<SigMF />} />
          <Route path="siggen" element={<SignalGenerator />} />
          <Route path="plugins" element={<Plugins />} />
          <Route path="validator" element={<Validator />} />
          {
            // Remove redoc until we can get it to work with the new version of React
            /* <Route
              path="/openapi"
              element={
                <RedocStandalone
                  options={{
                    theme: redocTheme,
                    hideDownloadButton: true,
                  }}
                  specUrl="https://raw.githubusercontent.com/IQEngine/IQEngine/main/detectors/openapi.yaml"
                />
              }
            /> */
          }
          <Route path="/" element={<RepoBrowserContainer />} />
          <Route path="recordings/spectrogram/:recording" element={<SpectrogramContainer />} />
          <Route path="recordings/:accountName?/:containerName?/:sasToken?" element={<RecordingsListContainer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
