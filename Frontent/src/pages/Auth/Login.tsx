import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/auth';
import { isValidEmail, isValidPassword } from '../../utils/validators';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const message = location.state?.message;

  // Redirect if already authenticated
  useEffect(() => {
    const admin = authService.getCurrentAdmin();
    const user = authService.getCurrentUser();
    
    if (admin) {
      navigate('/admin/dashboard', { replace: true });
    } else if (user) {
      navigate('/orders', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPassword(formData.password)) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(formData);
      
      // Check approval status from response
      if (response.status === 'pending') {
        setError('Your account is under review. Please wait for admin approval.');
        setLoading(false);
        return;
      }
      if (response.status === 'rejected') {
        setError('Your account was rejected. Contact support.');
        setLoading(false);
        return;
      }
      if (response.status === 'approved_no_uid') {
        setError('Admin has approved your account but hasn\'t assigned a restaurant UID yet. Please wait.');
        setLoading(false);
        return;
      }

      // Success - redirect to orders page
      navigate('/orders');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1C8C3C] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-1">Welcome Back</h2>
          <p className="text-gray-500">Restaurant Owner Login</p>
        </div>

        {message && (
          <div className="bg-[#1C8C3C]/10 border border-[#1C8C3C]/30 text-[#1C8C3C] px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C8C3C]/30 focus:border-[#1C8C3C] transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-[#F5F5F5] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1C8C3C]/30 focus:border-[#1C8C3C] transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 px-4 rounded-lg text-white font-semibold transition-all duration-200 active:scale-[0.98] ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#1C8C3C] hover:bg-[#157030]'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#1C8C3C] hover:text-[#157030] font-semibold">
              Sign up here
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/admin/login" className="text-sm text-gray-400 hover:text-[#1A1A1A] transition-colors">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
