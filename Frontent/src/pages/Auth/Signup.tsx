import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { SignupFormData } from '../../types/user.types';
import { isValidEmail, isValidPhone, isValidPassword, isRequired } from '../../utils/validators';

const Signup = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<SignupFormData>({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    restaurant_name: '',
    restaurant_address: '',
    restaurant_phone: '',
    restaurant_email: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: '',
    upi_id: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!isRequired(formData.full_name)) {
      setError('Full name is required');
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    if (!isValidPassword(formData.password)) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!isRequired(formData.restaurant_name)) {
      setError('Restaurant name is required');
      return;
    }
    if (!isRequired(formData.restaurant_address)) {
      setError('Restaurant address is required');
      return;
    }
    if (!isValidPhone(formData.restaurant_phone)) {
      setError('Please enter a valid restaurant phone number');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.signup(formData);
      console.log('Signup successful:', response);
      navigate('/login', {
        state: { message: 'Account created! Please wait for admin approval.' },
      });
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.message 
        || err.message 
        || 'Signup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10">
      <div className="glass-panel p-8 md:p-10 rounded-2xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <h2 className="text-3xl font-bold text-secondary mb-2">Create Account</h2>
          <p className="text-gray-500">Join KhaoGully as a Restaurant Owner</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Details */}
          <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center">
              <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold shadow-sm">1</span>
              Personal Details
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 characters"
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurant Details */}
          <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-secondary flex items-center">
              <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold shadow-sm">2</span>
              Restaurant Details
            </h3>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="restaurant_name"
                  value={formData.restaurant_name}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurant Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="restaurant_address"
                  value={formData.restaurant_address}
                  onChange={handleChange}
                  rows={3}
                  className="input-field"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="restaurant_phone"
                    value={formData.restaurant_phone}
                    onChange={handleChange}
                    placeholder="10-digit number"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Restaurant Email (Optional)
                  </label>
                  <input
                    type="email"
                    name="restaurant_email"
                    value={formData.restaurant_email}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details (Optional) */}
          <div className="bg-gray-50/80 p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold mb-2 text-secondary flex items-center">
              <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold shadow-sm">3</span>
              Bank Details (Optional)
            </h3>
            <p className="text-sm text-gray-500 mb-4">You can add these details now or update them later in your profile</p>

            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="bank_account_holder_name"
                    value={formData.bank_account_holder_name}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="bank_ifsc_code"
                    value={formData.bank_ifsc_code}
                    onChange={handleChange}
                    placeholder="e.g., SBIN0001234"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    name="upi_id"
                    value={formData.upi_id}
                    onChange={handleChange}
                    placeholder="e.g., username@upi"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-4 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-dark font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
