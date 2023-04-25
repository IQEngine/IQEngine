// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
// @ts-ignore
import { App } from './App';
// @ts-ignore
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
// @ts-ignore
import store from './Store/store';
import Layout from './pages/Layout';
import Admin from './pages/Admin';
import Query from './pages/Query';
import Upload from './pages/Upload';
import Home from './pages/Home';
import Visualization from './pages/Visualization';
// @ts-ignore
import { About } from './About';
// @ts-ignore
import SignalGenerator from './Components/SignalGenerator/SignalGenerator';
// @ts-ignore
import { Plugins } from './Plugins';
// @ts-ignore
import RepoBrowserContainer from './Containers/RepoBrowserContainer';
// @ts-ignore
import SpectrogramContainer from './Containers/SpectrogramContainer';
// @ts-ignore
import RecordingsListContainer from './Containers/RecordingsListContainer';

// @ts-ignore
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route path="/about" element={<About />} />
          <Route path="/siggen" element={<SignalGenerator />} />
          <Route path="/plugins" element={<Plugins />} />
          <Route path="/" element={<RepoBrowserContainer />} />
          <Route path="/recordings/spectrogram/:recording" element={<SpectrogramContainer />} />
          <Route path="/recordings/:accountName?/:containerName?/:sasToken?" element={<RecordingsListContainer />} />
        </Route>
        <Route path="/v2" element={<Layout />} >
          <Route path="/v2/" element={<Home />} />
          <Route path="admin" element={<Admin />} />
          <Route path="query" element={<Query />} />
          <Route path="upload" element={<Upload />} />
          <Route path='visualization' element={<Visualization />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </Provider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
