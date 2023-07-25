import SignalGenerator from '@/pages/signal-generator/SignalGenerator';
import { createBrowserRouter } from 'react-router-dom';
import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import { useProtectedRoute } from '@/auth/hooks/use-protected-route';
import { DocsPages } from '@/pages/docs/docs-pages';

export function useRouter() {
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
            let { SigMF } = await import('@/pages/sigmf');
            return { Component: SigMF };
          },
        },
        {
          path: 'query',
          async lazy() {
            let { MetadataQuery } = await import('@/pages/metadata-query/metadata-query');
            return { Component: MetadataQuery };
          },
        },
        {
          path: 'upload',
          async lazy() {
            let { UploadPage } = await import('@/pages/upload-page');
            return { Component: UploadPage };
          },
        },
        {
          path: 'docs',
          async lazy() {
            return { Component: DocsPages };
          },
        },
        // because there are so many docs pages, we have one component that takes in the page name as a param
        {
          path: 'docs/:page',
          async lazy() {
            return { Component: DocsPages };
          },
        },
        { path: 'siggen', element: <SignalGenerator /> },
        {
          path: 'admin',
          async lazy() {
            let { Admin } = await import('@/pages/admin/admin');

            return {
              Component: () => {
                return useProtectedRoute(<Admin />);
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
            let { SpectrogramPage } = await import('@/pages/spectrogram/spectrogram-page');
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
