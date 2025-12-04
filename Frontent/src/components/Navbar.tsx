import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const admin = authService.getCurrentAdmin();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 bg-[#1C8C3C] shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <Link to="/" className="text-2xl font-black text-white tracking-tight hover:opacity-90 transition-opacity">
                Khao<span className="text-[#1A1A1A]">Gully</span>
              </Link>
              {isAuthenticated && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20 text-white border border-white/30">
                  {isAdminRoute ? 'Admin' : 'Owner'}
                </span>
              )}
            </div>
            
            {/* Owner Navigation Links */}
            {isAuthenticated && !isAdminRoute && (
              <div className="flex items-center gap-2">
                <Link
                  to="/orders"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    location.pathname === '/orders'
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  to="/earnings"
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    location.pathname.startsWith('/earnings')
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Earnings
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm font-medium text-white/90">
                  Hi, <span className="font-bold text-white">{admin ? admin.full_name : user?.full_name}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white text-[#1C8C3C] hover:bg-gray-100 px-5 py-2 rounded-lg font-semibold transition-all duration-200 active:scale-95"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white/90 hover:text-white font-medium transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#1A1A1A] hover:bg-black text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
