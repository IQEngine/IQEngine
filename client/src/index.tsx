// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';
import 'swagger-ui-react/swagger-ui.css';
// @ts-ignore
import reportWebVitals from '@/utils/reportWebVitals';
import { RouterProvider } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { FeatureFlagsProvider } from '@/hooks/useFeatureFlags';
import { useIQEngineQueryClient } from '@/hooks/useIQEngineQueryClient';
import { useIQEngineRouter } from '@/hooks/useIQEngineRouter';
import { useIQEngineAuthProvider } from './hooks/useIQEngineAuthProvider';

const container = document.getElementById('root');
if (!container) throw new Error('No root element found');
const root = createRoot(container);
const { queryClient } = useIQEngineQueryClient();
const { router } = useIQEngineRouter();
const { AuthProvider } = useIQEngineAuthProvider();
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeatureFlagsProvider flags={null}>
        <RouterProvider router={router} />
      </FeatureFlagsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
