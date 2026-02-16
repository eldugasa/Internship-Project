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
      const result = await signup(form);
      
      if (result.success) {
        navigate('/team-member/dashboard');
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
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
          <h1 className="text-4xl font-black text-[#2D4A6B] mb-3">
            Join <span className="text-[#4DA5AD]">TaskFlow</span>
          </h1>
          <p className="text-gray-600 text-lg">Start managing your projects efficiently</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
          {/* Role Notice */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[#4DA5AD]/10 to-[#2D4A6B]/10 border border-[#4DA5AD]/20">
            <p className="text-sm text-[#2D4A6B]/80">
              <span className="font-semibold">Note:</span> New accounts start as Team Members. 
              Role upgrades are managed by administrators.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-red-700">{error}</p>
              {error.includes('already registered') && (
                <Link to="/login" className="text-sm font-semibold text-[#4DA5AD] block mt-2">
                  → Go to Login
                </Link>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                Full Name
              </label>
              <input
                name="name"
                placeholder="Elias"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                Work Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="elias@company.com"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none"
              />
            </div>

            {/* Password Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
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
                  className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                  Confirm
                </label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 text-lg font-bold text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center border-t border-gray-200 pt-6">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#4DA5AD] hover:text-[#2D4A6B]">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;