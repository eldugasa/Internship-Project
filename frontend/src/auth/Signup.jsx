import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!form.name.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await signup(form);
      navigate('/team-member/dashboard');
    } catch (err) {
      setError('Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          {/* <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-2xl flex items-center justify-center shadow-xl shadow-[#4DA5AD]/20">
              <div className="w-10 h-10 bg-white/95 rounded-xl"></div>
            </div>
          </div> */}
          <h1 className="text-4xl font-black text-[#2D4A6B] mb-3">
            Join <span className="text-[#4DA5AD]">TaskFlow</span>
          </h1>
          <p className="text-gray-600 text-lg">Start managing your projects efficiently</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Role Notice */}
          <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-[#4DA5AD]/10 to-[#2D4A6B]/10 border border-[#4DA5AD]/20">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#4DA5AD] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">ℹ</span>
              </div>
              <div>
                <h3 className="font-bold text-[#2D4A6B] text-sm mb-1">Account Type Notice</h3>
                <p className="text-[#2D4A6B]/80 text-sm">
                  All new accounts start as <span className="font-semibold">Team Members</span>. 
                  Admin and Project Manager roles are assigned by existing administrators after verification.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2">
                <span className="text-red-500">⚠</span>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                Full Name
              </label>
              <input
                name="name"
                placeholder="elias"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Email Field */}
            <div className="group">
              <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                Work Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="Elias@company.com"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Password Fields Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                  Password
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength="6"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                />
                <p className="mt-2 text-xs text-gray-500">Minimum 6 characters</p>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                  Confirm Password
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Role Badge */}
            <div className="p-5 rounded-xl border-2 border-dashed border-[#4DA5AD]/30 bg-gradient-to-r from-white to-gray-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#4DA5AD] mb-1">
                    Account Role
                  </div>
                  <div className="text-2xl font-bold text-[#2D4A6B]">Team Member</div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#4DA5AD]/10 rounded-full">
                  <div className="w-3 h-3 rounded-full bg-[#4DA5AD]"></div>
                  <span className="text-sm font-semibold text-[#4DA5AD]">Default Access</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                You'll have access to assigned tasks, project updates, and team collaboration features.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 text-lg font-bold text-white bg-gradient-to-r from-[#4DA5AD] via-[#3D95A3] to-[#2D4A6B] rounded-xl hover:shadow-2xl hover:shadow-[#4DA5AD]/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Team Member Account'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-[#4DA5AD] hover:text-[#2D4A6B] transition-colors"
              >
                Sign in here
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500 mt-4">
              For admin or project manager access, please contact your system administrator.
              <br />
              Demo accounts available for testing higher privileges.
            </p>
          </div>
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

export default Signup;