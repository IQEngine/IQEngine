import React from 'react';

export const Admin = () => {
  const [active, setActive] = React.useState(0);

  return (
    <>
      <div className="flex justify-center">
        <div>
          <ul className="menu w-52 p-2 bg-base-200 rounded-box">
            <li key={0} onClick={() => setActive(0)} aria-label="Users Menu Item">
              {active === 0 ? <a className="active">Users</a> : <a>Users</a>}
            </li>
            <li key={1} onClick={() => setActive(1)} aria-label="Data Sources Menu Item">
              {active === 1 ? <a className="active">Data Sources</a> : <a>Data Sources</a>}
            </li>
            <li key={2} onClick={() => setActive(2)} aria-label="Plugins Menu Item">
              {active === 2 ? <a className="active">Plugins</a> : <a>Plugins</a>}
            </li>
            <li key={3} onClick={() => setActive(3)} aria-label="Configuration Menu Item">
              {active === 3 ? <a className="active">Configuration</a> : <a>Configuration</a>}
            </li>
          </ul>
        </div>
        <div className="w-2/5 p-2">
          {active === 0 && (
            <div className="card shadow-lg compact side bg-base-100">
              <h2>Users</h2>
            </div>
          )}
          {active === 1 && (
            <div className="card shadow-lg compact side bg-base-100">
              <h2>Data Sources</h2>
            </div>
          )}
          {active === 2 && (
            <div className="card shadow-lg compact side bg-base-100">
              <h2>Plugins</h2>
            </div>
          )}
          {active === 3 && (
            <div className="card shadow-lg compact side bg-base-100">
              <h2>Configuration</h2>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Admin;
