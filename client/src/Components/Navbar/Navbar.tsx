import * as React from 'react';

function Navbar() {
  return (
    <div className="">
      <header className="">
        <a href="/" className="">
          <img width={200} src="/IQEngine.svg" alt="IQEngine" />
        </a>
        <nav className="py-2 bg-body-tertiary">
          <div className="">
            <ul className="">
              <li className="">
                <a href="/v2">
                  <i className="bi bi-house-door-fill"></i>
                  Home
                </a>
              </li>
              <li className="">
                <a href="admin">Admin</a>
              </li>
              <li className="">
                <a href="query">Query</a>
              </li>
            </ul>
            <ul className="">
              <li className="">
                <a href="/v2">Login</a>
              </li>
            </ul>
          </div>
        </nav>
      </header>
    </div>
  );
}

export default Navbar;
