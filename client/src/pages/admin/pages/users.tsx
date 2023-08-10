import { useConfigQuery } from '@/api/config/queries';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import axios from 'axios';
import React, { useEffect } from 'react';

export const Users = () => {
  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();
  const [users, setUsers] = React.useState([]);
  const [accessToken, setAccessToken] = React.useState('');
  const config = useConfigQuery();

  useEffect(() => {
    if (activeAccount) {
      const accessTokenRequest = {
        scopes: ['user.read.all', 'group.read.all'],
        authority: config.data?.appAuthority,
        account: activeAccount,
      };

      instance
        .acquireTokenSilent(accessTokenRequest)
        .then((accessTokenResponse) => {
          setAccessToken(accessTokenResponse.accessToken);
        })
        .catch((error) => {
          if (error instanceof InteractionRequiredAuthError) {
            instance
              .acquireTokenPopup(accessTokenRequest)
              .then(function (accessTokenResponse) {
                let accessToken = accessTokenResponse.accessToken;
                console.log(accessToken);
              })
              .catch(function (error) {
                console.log(error);
              });
          }
          console.log(error);
        });
    }
  }, []);

  useEffect(() => {
    axios
      .get(`https://graph.microsoft.com/v1.0/users?$expand=memberOf`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        setUsers(response.data.value);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [accessToken]);

  return (
    <div>
      <h2>Users</h2>
      <table className="table w-full">
        <thead className="text-left">
          <tr>
            <th>Id</th>
            <th>Display Name</th>
            <th>Security Groups</th>
          </tr>
        </thead>
        <tbody>
          {users?.map((user) => (
            <tr>
              <>
                <td>{user.id}</td>
                <td>{user.displayName}</td>
                <td>
                  {user?.memberOf?.map((group) => (
                    <p>{group.displayName}</p>
                  ))}
                </td>
              </>
            </tr>
          ))}{' '}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
