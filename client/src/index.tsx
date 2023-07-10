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
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from '@/authConfig';

export const msalInstance = new PublicClientApplication(msalConfig);

if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
  msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
}

msalInstance.enableAccountStorageEvents();

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    const account = event.payload.account;
    msalInstance.setActiveAccount(account);
  }
});

const container = document.getElementById('root');
if (!container) throw new Error('No root element found');
const root = createRoot(container);
const { queryClient } = useIQEngineQueryClient();
const { router } = useIQEngineRouter(msalInstance);
root.render(
  <MsalProvider instance={msalInstance}>
    <QueryClientProvider client={queryClient}>
      <FeatureFlagsProvider flags={null}>
        <RouterProvider router={router} />
      </FeatureFlagsProvider>
    </QueryClientProvider>
  </MsalProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
