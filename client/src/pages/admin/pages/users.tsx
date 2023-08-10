import { useGetUsers } from '@/api/users/queries';
import React from 'react';

export const Users = () => {
  const { data } = useGetUsers();

  return (
    <div className="card shadow-lg compact side bg-base-100">
      <h2>Users</h2>
      {data && data?.length > 0 ? (
        <div>
          <table className="table w-full">
            <thead className="text-left">
              <tr>
                <th>Id</th>
                <th>Display Name</th>
                <th>Security Groups</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((user) => (
                <tr key={user.id}>
                  <>
                    <td>{user.id}</td>
                    <td>{user.displayName}</td>
                    <td>
                      {user?.memberOf?.map((group) => (
                        <p key={group.id}>{group.displayName}</p>
                      ))}
                    </td>
                  </>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default Users;
