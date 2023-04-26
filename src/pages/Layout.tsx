import * as React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../Components/Navbar/Navbar";
import Footer from "Components/Footer/Footer";
import ThemeSelector from "Components/Styles/ThemeSelector";

const Layout = () => {
  return (
    <ThemeSelector>
      <Navbar />
      <Outlet />
      <Footer />
    </ThemeSelector>
  );
};

export default Layout;