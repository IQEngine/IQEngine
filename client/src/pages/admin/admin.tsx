import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export const Admin = () => {
  const [active, setActive] = React.useState(0);

  return (
    <>
      <div className="flex justify-center">
        <div>
          <ul className="menu w-52 p-2 bg-base-200 rounded-box">
            <li key={0} onClick={() => setActive(0)} aria-label="Users Menu Item">
              {active === 0 ? (
                <Link to="/admin/users" className="active">
                  Users
                </Link>
              ) : (
                <Link to="/admin/users">Users</Link>
              )}
            </li>
            <li key={1} onClick={() => setActive(1)} aria-label="Data Sources Menu Item">
              {active === 1 ? (
                <Link to="/admin/data-sources" className="active">
                  Data Sources
                </Link>
              ) : (
                <Link to="/admin/data-sources">Data Sources</Link>
              )}
            </li>
            <li key={2} onClick={() => setActive(2)} aria-label="Plugins Menu Item">
              {active === 2 ? (
                <Link to="/admin/plugins" className="active">
                  Plugins
                </Link>
              ) : (
                <Link to="/admin/plugins">Plugins</Link>
              )}
            </li>
            <li key={3} onClick={() => setActive(3)} aria-label="Configuration Menu Item">
              {active === 3 ? (
                <Link to="/admin/configuration" className="active">
                  Configuration
                </Link>
              ) : (
                <Link to="/admin/configuration">Configuration</Link>
              )}
            </li>
          </ul>
        </div>
        <div className="w-2/5 p-2">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Admin;
