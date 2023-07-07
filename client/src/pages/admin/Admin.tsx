import React from 'react';
import { MsalProvider, AuthenticatedTemplate, useMsal, UnauthenticatedTemplate } from '@azure/msal-react';
import { loginRequest } from './authConfig';

const AdminContent = () => {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();

  const handleLoginPopup = () => {
    instance
      .loginPopup({
        ...loginRequest,
        redirectUri: '/Admin',
      })
      .catch((error) => console.log(error));
  };

  return (
    <div>
      <AuthenticatedTemplate>
        {activeAccount ? (
          <div className="flex justify-center">
            <h1>You have successfully logged in!</h1>
          </div>
        ) : null}
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <div className="flex justify-center">
          <h1>Please Sign In as an administrator</h1>
        </div>
        <div className="flex justify-center">
          <button onClick={handleLoginPopup}>Sign In</button>
        </div>
      </UnauthenticatedTemplate>
    </div>
  );
};

export const Admin = ({ instance }) => {
  return (
    <MsalProvider instance={instance}>
      <AdminContent />
    </MsalProvider>
  );
};

export default Admin;
