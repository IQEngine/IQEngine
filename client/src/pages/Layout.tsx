import * as React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '@/Components/Navbar/Navbar';
import Footer from '@/Components/Footer/Footer';
import ThemeSelector from '@/Components/Styles/ThemeSelector';

const Layout = () => {
  return (
    <ThemeSelector>
      <div className="bg-white">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </ThemeSelector>
  );
};

export default Layout;
