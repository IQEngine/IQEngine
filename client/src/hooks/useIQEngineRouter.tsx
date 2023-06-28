import { App } from '@/App';
import { About } from '@/pages/About';
import { SigMF } from '@/pages/SigMF';
import { Plugins } from '@/pages/Plugins';
import SignalGenerator from '@/pages/signalGenerator/SignalGenerator';
import Validator from '@/Components/Validator/Validator';
import { createBrowserRouter } from 'react-router-dom';
import React from 'react';
import RepoBrowser from '@/Components/RepoBrowser/RepoBrowser';
import RecordingsBrowser from '@/Components/RecordingsBrowser/RecordingsBrowser';
import SpectrogramPage from '@/pages/spectrogram/SpectrogramPage';
import SwaggerUI from 'swagger-ui-react';

export function useIQEngineRouter() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <App />,
      children: [
        { path: 'about', element: <About /> },
        { path: 'sigmf', element: <SigMF /> },
        { path: 'siggen', element: <SignalGenerator /> },
        { path: 'plugins', element: <Plugins /> },
        { path: 'validator', element: <Validator /> },
        { index: true, element: <RepoBrowser /> },
        { path: 'recordings/:type/:account/:container/:sasToken?', element: <RecordingsBrowser /> },
        { path: 'spectrogram/:type/:account/:container/:filePath/:sasToken?', element: <SpectrogramPage /> },
      ],
    },
    {
      path: '/openapi',
      element: (
        <div className="bg-white">
          <SwaggerUI url="https://raw.githubusercontent.com/IQEngine/IQEngine/main/plugins/openapi.yaml" />
        </div>
      ),
    },
  ]);

  return {
    router,
  };
}
