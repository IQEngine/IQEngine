import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from '@/authConfig';
import { useConfigQuery } from '@/api/config/queries';
import { MsalProvider } from '@azure/msal-react';
import React from 'react';

export const AuthProvider = ({ children }) => {
  const config = useConfigQuery();
  const msalInstance = new PublicClientApplication(msalConfig(config));

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

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};

export function useIQEngineAuthProvider() {
  return { AuthProvider };
}
