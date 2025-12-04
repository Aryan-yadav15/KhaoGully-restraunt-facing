import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const isAuthenticated = authService.isAuthenticated();
      
      if (!isAuthenticated) {
        setIsValid(false);
        setIsChecking(false);
        return;
      }

      if (adminOnly) {
        const admin = authService.getCurrentAdmin();
        setIsValid(!!admin);
      } else {
        setIsValid(true);
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [adminOnly, location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Checking authentication...</div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
