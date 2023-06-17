// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
// @ts-ignore
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '@/Store/store';
import { About } from '@/pages/About';
import { SigMF } from '@/pages/SigMF';
import { Plugins } from '@/pages/Plugins';
import SignalGenerator from './pages/signalGenerator/SignalGenerator';
import Validator from './Components/Validator/Validator';
import { App } from './App';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RepoBrowser from './Components/RepoBrowser/RepoBrowser';
import RecordingsBrowser from './Components/RecordingsBrowser/RecordingsBrowser';
import SpectrogramPage from './Components/Spectrogram/SpectrogramPage';
import { CLIENT_TYPE_BLOB } from './api/Models';
import { FeatureFlagsProvider } from './Components/FeatureFlagsContext/FeatureFlagsContext';

// @ts-ignore
const queryClient = new QueryClient();
queryClient.setQueryDefaults(['config'], { staleTime: 1000 * 60 * 60 * 24 });
queryClient.setQueryDefaults(['datasource', CLIENT_TYPE_BLOB], { staleTime: 1000 * 60 });
var new_version: boolean = false;
// Select which version to run based on an environment variable
const container = document.getElementById('root');
if (!container) throw new Error('No root element found');
const root = createRoot(container);
root.render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <FeatureFlagsProvider flags={null}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route path="about" element={<About />} />
              <Route path="sigmf" element={<SigMF />} />
              <Route path="siggen" element={<SignalGenerator />} />
              <Route path="plugins" element={<Plugins />} />
              <Route path="validator" element={<Validator />} />
              <Route
                path="/openapi"
                element={
                  <div className="bg-white">
                    <SwaggerUI url="https://raw.githubusercontent.com/IQEngine/IQEngine/main/detectors/openapi.yaml" />
                  </div>
                }
              />
              <Route path="/" element={<RepoBrowser />} />
              <Route path="recordings/" element={<RecordingsBrowser />} />
              <Route path="recordings/:type/:account/:container/:sasToken?" element={<RecordingsBrowser />} />
              <Route path="spectrogram/:type/:account/:container/:filePath/:sasToken?" element={<SpectrogramPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </FeatureFlagsProvider>
    </Provider>
  </QueryClientProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
