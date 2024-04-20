// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import 'swagger-ui-react/swagger-ui.css';
// @ts-ignore
import reportWebVitals from '@/utils/reportWebVitals';
import { RouterProvider } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { FeatureFlagsProvider } from '@/hooks/use-feature-flags';
import { useRouter } from '@/hooks/use-router';
import { useAuthProvider } from '@/auth/hooks/use-auth-provider';
import { CLIENT_TYPE_BLOB } from '@/api/Models';

const container = document.getElementById('root');
if (!container) throw new Error('No root element found');
const root = createRoot(container);

// React Query stuff
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});
queryClient.setQueryDefaults(['config'], { staleTime: 1000 * 60 * 60 * 24 });
queryClient.setQueryDefaults(['datasource', CLIENT_TYPE_BLOB], { staleTime: 1000 * 60 });
queryClient.setQueryDefaults(['plugins'], { staleTime: 1000 * 60 * 5 });
queryClient.setQueryDefaults(['rawiqdata'], { staleTime: Infinity });
queryClient.setQueryDefaults(['iqData'], { staleTime: 5, cacheTime: 10 });
queryClient.setQueryDefaults(['user-settings'], { staleTime: Infinity });
queryClient.setQueryDefaults(['smart-query'], { staleTime: 1000 * 60 * 60 * 24 });

const { router } = useRouter();
const { AuthProvider } = useAuthProvider();
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeatureFlagsProvider flags={null}>
        <RouterProvider router={router} />
      </FeatureFlagsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// If you want to start measuring performance in your app, pass a function to log results (for example: reportWebVitals(console.log)) or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
