import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { msalConfig } from '@/auth/auth-config';
import { useConfigQuery } from '@/api/config/queries';
import { MsalProvider } from '@azure/msal-react';
import React from 'react';

export const AuthProvider = ({ children }) => {
  // Without this, IQEngine wont work when deployed onprem without https set up (unless localhost is used)
  if (window.location.protocol === 'http:') {
    console.log('WARNING- HTTP MODE! MSAL WILL NOT WORK!');
    return <>{children}</>;
  }

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
      window.location.reload();
    }
  });

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};

export function useAuthProvider() {
  return { AuthProvider };
}
