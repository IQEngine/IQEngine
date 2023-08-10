import { useConfigQuery } from '@/api/config/queries';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { useEffect, useState } from 'react';

export const useAccessToken = () => {
  const { instance } = useMsal();
  const config = useConfigQuery();
  const accessTokenRequest = {
    scopes: [`api://${config.data?.appId}/user`],
    authority: config.data?.appAuthority,
  };
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    instance
      .acquireTokenSilent(accessTokenRequest)
      .then((accessTokenResponse) => {
        setAccessToken(accessTokenResponse?.accessToken);
      })
      .catch((error) => {
        if (error instanceof InteractionRequiredAuthError) {
          instance.acquireTokenPopup(accessTokenRequest).then(function (accessTokenResponse) {
            setAccessToken(accessTokenResponse?.accessToken);
          });
        }
      });
  }, [instance, accessTokenRequest]);

  return accessToken;
};
