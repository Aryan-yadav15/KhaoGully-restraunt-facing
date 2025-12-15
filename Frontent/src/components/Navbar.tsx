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
    <nav className="sticky top-0 z-50 glass-nav shadow-lg">
      <div className="w-full px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-0 sm:h-16 gap-3 sm:gap-0">
          {/* Top row on mobile: Logo and badge */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-8 w-full sm:w-auto">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                <img src="/LogoCircle.svg" alt="KhaoGully Logo" className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" />
                <span className="text-lg sm:text-2xl font-black text-white tracking-tight whitespace-nowrap">
                  Khao<span className="text-secondary">Gully</span>
                </span>
              </Link>
              {isAuthenticated && (
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-semibold rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm whitespace-nowrap flex-shrink-0 ml-2">
                  {isAdminRoute ? 'Admin' : 'Owner'}
                </span>
              )}
            </div>
            
            {/* Mobile logout button */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="sm:hidden bg-white text-primary hover:bg-gray-50 px-3 py-1.5 rounded-lg font-semibold shadow-md transition-all duration-200 active:scale-95 text-sm flex-shrink-0"
              >
                Logout
              </button>
            )}
          </div>

          {/* Bottom row on mobile: Navigation and desktop user info */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Owner Navigation Links */}
            {isAuthenticated && !isAdminRoute && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-grow sm:flex-grow-0">
                <Link
                  to="/orders"
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    location.pathname === '/orders'
                      ? 'bg-white text-primary shadow-md'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Orders
                </Link>
                <Link
                  to="/earnings"
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                    location.pathname.startsWith('/earnings')
                      ? 'bg-white text-primary shadow-md'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Earnings
                </Link>
              </div>
            )}

            {/* Desktop user info and logout */}
            <div className="hidden sm:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm font-medium text-white/90 hidden lg:block">
                    Hi, <span className="font-bold text-white">{admin ? admin.full_name : user?.full_name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-white text-primary hover:bg-gray-50 px-5 py-2 rounded-lg font-semibold shadow-md transition-all duration-200 active:scale-95"
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
                    className="bg-secondary hover:bg-black text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
