import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export const Admin = () => {
  const [active, setActive] = React.useState(null);
  let location = useLocation();

  const { instance } = useMsal();
  const activeAccount = instance.getActiveAccount();

  useEffect(() => {
    switch (location.pathname) {
      case '/admin/users':
        setActive(0);
        break;
      case '/admin/data-sources':
        setActive(1);
        break;
      case '/admin/plugins':
        setActive(2);
        break;
      case '/admin/configuration':
        setActive(3);
        break;
      default:
        setActive(0);
    }
  }, [location.pathname]);

  if (
    activeAccount === null ||
    activeAccount === undefined ||
    activeAccount?.idTokenClaims?.roles?.includes('IQEngine-Admin') === false
  ) {
    return (
      <div className="flex justify-center text-lg text-center">
        <p>You are unauthorized to view this page.</p>
        <p>Please contact your administrator.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center">
        <div>
          <ul className="menu w-52 p-2 bg-base-200 rounded-box">
            <li key={0} aria-label="Users Menu Item">
              {active === 0 ? (
                <Link to="/admin/users" className="active">
                  Users
                </Link>
              ) : (
                <Link to="/admin/users">Users</Link>
              )}
            </li>
            <li key={1} aria-label="Data Sources Menu Item">
              {active === 1 ? (
                <Link to="/admin/data-sources" className="active">
                  Data Sources
                </Link>
              ) : (
                <Link to="/admin/data-sources">Data Sources</Link>
              )}
            </li>
            <li key={2} aria-label="Plugins Menu Item">
              {active === 2 ? (
                <Link to="/admin/plugins" className="active">
                  Plugins
                </Link>
              ) : (
                <Link to="/admin/plugins">Plugins</Link>
              )}
            </li>
            <li key={3} aria-label="Configuration Menu Item">
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
        <div className="w-3/4 p-2">
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default Admin;
