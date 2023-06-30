import * as React from 'react';

function Footer() {
  return (
    <div className="container">
      <footer className="row row-cols-1 row-cols-sm-2 row-cols-md-5 py-5 my-5 border-top">
        <div className="col mb-3">
          <a href="/" className="d-flex align-items-center mb-3 link-body-emphasis text-decoration-none">
            <img width={200} src="/IQEngine.svg" alt="IQEngine" />
          </a>
          <p className="text-body-secondary">© 2023</p>
        </div>

        <div className="col mb-3"></div>

        <div className="col mb-3">
          <h5>IQEngine</h5>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <a href="/v2/" className="nav-link p-0 text-body-secondary">
                Home
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="/v2/about" className="nav-link p-0 text-body-secondary">
                About
              </a>
            </li>
            <li className="nav-item mb-2">
              <a href="https://github.com/IQEngine/IQEngine" className="nav-link p-0 text-body-secondary">
                Github
              </a>
            </li>
          </ul>
        </div>

        <div className="col mb-3">
          <h5>Admin</h5>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <a href="/v2/admin" className="nav-link p-0 text-body-secondary">
                Admin
              </a>
            </li>
          </ul>
        </div>

        <div className="col mb-3">
          <h5>Upload</h5>
          <ul className="nav flex-column">
            <li className="nav-item mb-2">
              <a href="/v2/upload" className="nav-link p-0 text-body-secondary">
                Upload
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
