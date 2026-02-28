// src/auth/Login.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { forgotPasswordApi } from '../services/authService';

const SignIn = () => {
  const [form, setForm] = useState({ 
    email: '', 
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (form.password.length < 1) {
      setError('Please enter your password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = await login(form.email, form.password);
      
      // Remember me functionality
      if (form.rememberMe) {
        localStorage.setItem('rememberedEmail', form.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Redirect based on role - FIXED PATHS
      if (user) {
        const normalizeRole = (r = '') => (r || '').toLowerCase().replace(/_/g, '-');
        const userRole = normalizeRole(user.role);

        switch (userRole) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'project-manager':
            navigate('/manager/dashboard');
            break;
          case 'team-member':
            navigate('/team-member/dashboard');
            break;
          default:
            navigate('/team-member/dashboard');
        }
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotEmail.includes('@')) {
      setForgotMessage('Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      // call backend endpoint to send reset link
      const res = await forgotPasswordApi(forgotEmail);
      // backend returns generic message; in development it includes token
      setForgotMessage(
        res.message || `Password reset link sent to ${forgotEmail}. Check your email.`
      );

      // close form after a short delay
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotMessage('');
      }, 3000);
    } catch (err) {
      console.error('Forgot password API error:', err);
      setForgotMessage(
        err.message || 'Failed to send reset link. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (email) => {
    const demoPasswords = {
      'admin@taskflow.com': 'adminpass',
      'pm@task.com': 'pmpass',  // FIXED: Correct email from DataService
      'member@task.com': 'memberpass'  // FIXED: Correct email from DataService
    };

    const password = demoPasswords[email] || 'password123';
    setForm({ email, password, rememberMe: false });
    setTimeout(async () => {
      try {
        const user = await login(email, password);
        if (user) {
            const normalizeRole = (r = '') => (r || '').toLowerCase().replace(/_/g, '-');
            const userRole = normalizeRole(user.role);

            switch (userRole) {
              case 'admin':
                navigate('/admin/dashboard');
                break;
              case 'project-manager':
                navigate('/manager/dashboard');
                break;
              case 'team-member':
                navigate('/team-member/dashboard');
                break;
              default:
                navigate('/team-member/dashboard');
            }
        }
      } catch (err) {
        setError('Demo login failed. Please check demo credentials.');
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-2xl flex items-center justify-center shadow-xl shadow-[#4DA5AD]/20">
              <div className="w-10 h-10 bg-white/95 rounded-xl"></div>
            </div>
          </div>
          <h1 className="text-4xl font-black text-[#2D4A6B] mb-3">
            Welcome to <span className="text-[#4DA5AD]">TaskFlow</span>
          </h1>
          <p className="text-gray-600 text-lg">Sign in to manage your projects</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="mb-6 p-5 rounded-xl bg-gradient-to-r from-[#4DA5AD]/10 to-[#2D4A6B]/10 border border-[#4DA5AD]/20">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-[#2D4A6B]">Reset Your Password</h3>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4DA5AD]"
                />
                <button
                  onClick={handleForgotPassword}
                  className="px-4 py-2 bg-[#4DA5AD] text-white rounded-lg hover:opacity-90"
                >
                  Send
                </button>
              </div>
              
              {forgotMessage && (
                <div className={`mt-3 p-2 rounded text-sm ${forgotMessage.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {forgotMessage}
                </div>
              )}
            </div>
          )}

          {error && !showForgotPassword && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600">!</span>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          {!showForgotPassword && (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Password Field */}
                <div className="group">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-[#2D4A6B]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium text-[#4DA5AD] hover:text-[#2D4A6B] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={handleChange}
                    className="w-5 h-5 text-[#4DA5AD] border-gray-300 rounded focus:ring-[#4DA5AD]"
                  />
                  <label htmlFor="rememberMe" className="ml-3 text-gray-700 cursor-pointer">
                    Remember me on this device
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 text-lg font-bold text-white bg-gradient-to-r from-[#4DA5AD] via-[#3D95A3] to-[#2D4A6B] rounded-xl hover:shadow-2xl hover:shadow-[#4DA5AD]/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In to Dashboard'
                  )}
                </button>
              </form>

              {/* Demo Accounts Section - Updated with correct emails */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-[#2D4A6B] mb-4 text-center">
                  Try Demo Accounts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { email: 'admin@taskflow.com', role: 'Admin', icon: '👑', color: 'from-purple-100 to-purple-50' },
                    { email: 'pm@task.com', role: 'Manager', icon: '📋', color: 'from-blue-100 to-blue-50' },
                    { email: 'member@task.com', role: 'Member', icon: '👨‍💻', color: 'from-green-100 to-green-50' }
                  ].map((demo) => (
                    <button
                      key={demo.email}
                      onClick={() => handleDemoLogin(demo.email)}
                      className={`p-4 bg-gradient-to-br ${demo.color} border border-gray-200 rounded-xl hover:border-[#4DA5AD] hover:shadow-md transition-all duration-300 group`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                          {demo.icon}
                        </span>
                        <div className="font-medium text-gray-900">{demo.role}</div>
                        <div className="text-xs text-gray-500 truncate w-full text-center">
                          {demo.email.split('@')[0]}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="mt-8 flex items-center">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="px-4 text-sm text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Sign Up Link */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-bold text-[#4DA5AD] hover:text-[#2D4A6B] transition-colors"
                  >
                    Create one now
                  </Link>
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  New accounts start as Team Members. Contact admin for higher access.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#2D4A6B] transition-colors"
          >
            <span>←</span>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;