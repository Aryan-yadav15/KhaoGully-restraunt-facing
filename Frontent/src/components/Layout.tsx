import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow w-full px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
