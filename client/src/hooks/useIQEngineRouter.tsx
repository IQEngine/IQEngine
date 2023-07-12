import SignalGenerator from '@/pages/signal-generator/SignalGenerator';
import { createBrowserRouter } from 'react-router-dom';
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import { useIQEngineProtectedRoute } from '@/auth/hooks/useIQEngineProtectedRoute';

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
          path: 'admin',
          async lazy() {
            let { Admin } = await import('@/pages/admin/admin');

            return {
              Component: () => {
                return useIQEngineProtectedRoute(<Admin />);
              },
            };
          },

          children: [
            {
              path: '',
              async lazy() {
                let { Users } = await import('@/pages/admin/pages/users');
                return { Component: Users };
              },
            },
            {
              path: 'data-sources',
              async lazy() {
                let { DataSources } = await import('@/pages/admin/pages/data-sources');
                return { Component: DataSources };
              },
            },
            {
              path: 'configuration',
              async lazy() {
                let { Configuration } = await import('@/pages/admin/pages/configuration');
                return { Component: Configuration };
              },
            },
            {
              path: 'plugins',
              async lazy() {
                let { Plugins } = await import('@/pages/admin/pages/plugins');
                return { Component: Plugins };
              },
            },
            {
              path: 'users',
              async lazy() {
                let { Users } = await import('@/pages/admin/pages/users');
                return { Component: Users };
              },
            },
          ],
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
      element: (
        <div className="bg-white">
          <SwaggerUI url="https://raw.githubusercontent.com/IQEngine/IQEngine/main/plugins/plugins_openapi.yaml" />
        </div>
      ),
    },
  ]);

  return {
    router,
  };
}
