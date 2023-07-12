import { Navigate } from 'react-router-dom';
import React from 'react';
import { useMsal } from '@azure/msal-react';

export function useProtectedRoute(children) {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();

  if (!activeAccount) {
    return <Navigate to="/" />;
  }
  return children;
}
