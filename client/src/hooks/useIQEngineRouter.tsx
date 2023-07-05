import SignalGenerator from '@/pages/signal-generator/SignalGenerator';
import { createBrowserRouter } from 'react-router-dom';
import React from 'react';

export function useIQEngineRouter() {
  const router = createBrowserRouter([
    {
      path: '/',
      async lazy() {
        let { App } = await import('@/App');
        return { Component: App };
      },
      children: [
        {
          path: 'about',
          async lazy() {
            let { About } = await import('@/pages/About');
            return { Component: About };
          },
        },
        {
          path: 'sigmf',
          async lazy() {
            let { SigMF } = await import('@/pages/SigMF');
            return { Component: SigMF };
          },
        },
        { path: 'siggen', element: <SignalGenerator /> },
        {
          path: 'plugins',
          async lazy() {
            let { Plugins } = await import('@/pages/Plugins');
            return { Component: Plugins };
          },
        },
        {
          path: 'validator',
          async lazy() {
            let { Validator } = await import('@/pages/validator/Validator');
            return { Component: Validator };
          },
        },
        {
          index: true,
          async lazy() {
            let { RepoBrowser } = await import('@/pages/repo-browser/RepoBrowser');
            return { Component: RepoBrowser };
          },
        },
        {
          path: 'recordings/:type/:account/:container/:sasToken?',
          async lazy() {
            let { RecordingsBrowser } = await import('@/pages/recordings-browser/RecordingsBrowser');
            return { Component: RecordingsBrowser };
          },
        },
        {
          path: 'spectrogram/:type/:account/:container/:filePath/:sasToken?',
          async lazy() {
            let { SpectrogramPage } = await import('@/pages/spectrogram/SpectrogramPage');
            return { Component: SpectrogramPage };
          },
        },
      ],
    },
    {
      path: '/openapi',
      async lazy() {
        let { SwaggerUI } = await import('swagger-ui-react');
        return {
          Component: () => {
            return (
              <div className="bg-white">
                <SwaggerUI url="https://raw.githubusercontent.com/IQEngine/IQEngine/main/plugins/openapi.yaml" />
              </div>
            );
          },
        };
      },
    },
  ]);

  return {
    router,
  };
}
