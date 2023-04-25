import * as React from "react";
import {Outlet} from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "Components/Footer/Footer";

const Layout = () => {
  return (
    <div className="col-lg-8 mx-auto p-4 py-md-5">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};

export default Layout;