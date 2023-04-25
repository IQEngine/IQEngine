import * as React from "react";
import Nav from 'react-bootstrap/Nav';

function Navbar() {
  return (
    <div className="container  border-bottom">

      <header className="d-flex flex-wrap mb-4">
        <a href="/" className="d-flex align-items-center mb-2 mb-md-0 me-md-auto text-decoration-none">
          <img width={200} src="/IQEngine.svg" alt="IQEngine"  />
        </a>
        <nav className="py-2 bg-body-tertiary">
          <div className="container d-flex flex-wrap">
            <ul className="nav me-auto">
              <li className="nav-item"><Nav.Link href="/v2">Home</Nav.Link></li>
              <li className="nav-item"><Nav.Link href="admin">Admin</Nav.Link></li>
              <li className="nav-item"><Nav.Link href="query">Query</Nav.Link></li>
            </ul>
            <ul className="nav">
              <li className="nav-item"><Nav.Link href="/v2">Login</Nav.Link></li>
            </ul>
          </div>
        </nav>
      </header>

    </div>
  );
}

export default Navbar;