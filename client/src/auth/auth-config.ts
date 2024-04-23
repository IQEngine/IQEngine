import { LogLevel } from '@azure/msal-browser';

export const msalConfig = (config) => {
  return {
    auth: {
      clientId: config.data?.appId,
      authority: config.data?.appAuthority,
      redirectUri: '/',
      postLogoutRedirectUri: '/',
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: true,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Info:
              //console.info(message);
              return;
            case LogLevel.Verbose:
              //console.debug(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
            default:
              return;
          }
        },
      },
    },
  };
};

export const loginRequest = {
  scopes: ['User.Read'],
};
