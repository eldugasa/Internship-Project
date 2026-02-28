// src/pages/auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { forgotPasswordApi } from '../services/authService'; // Import from your service

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call your actual API from authService
      const response = await forgotPasswordApi(email);
      
      console.log('Reset response:', response);
      setSuccess('Password reset link sent to your email');
      setIsSubmitted(true);
      
      // Optional: Auto redirect after 3 seconds
      // setTimeout(() => navigate('/login'), 3000);
      
    } catch (err) {
      console.error('Password reset error:', err);
      
      // Handle different error scenarios based on your API response
      if (err.message?.includes('404') || err.status === 404) {
        setError('No account found with this email address');
      } else if (err.message?.includes('429') || err.status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (err.message?.includes('network')) {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.message || 'Failed to send reset link. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await forgotPasswordApi(email);
      setSuccess('Reset link resent successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to resend. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-2xl flex items-center justify-center shadow-xl shadow-[#4DA5AD]/20">
              <span className="text-white text-2xl font-bold">T</span>
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#2D4A6B] mb-3">
            Reset Password
          </h1>
          <p className="text-gray-600">
            {!isSubmitted 
              ? "Enter your email to receive a password reset link" 
              : "Check your inbox for the reset link"
            }
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
          {!isSubmitted ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      placeholder="you@company.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-5 py-3.5 bg-gray-50/50 border-2 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400 ${
                        error ? 'border-red-300' : 'border-gray-200'
                      }`}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 text-lg font-bold text-white bg-gradient-to-r from-[#4DA5AD] via-[#3D95A3] to-[#2D4A6B] rounded-xl hover:shadow-2xl hover:shadow-[#4DA5AD]/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-[#4DA5AD] hover:text-[#2D4A6B] font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              {/* Success Animation */}
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h3>
              
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to{' '}
                <span className="font-semibold text-[#2D4A6B] break-all">{email}</span>
              </p>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 text-left">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-700">📧 Didn't receive the email?</span>
                  <br />
                  • Check your spam or junk folder
                  <br />
                  • Make sure you entered the correct email
                  <br />
                  • The link will expire in 1 hour
                </p>
              </div>
              
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block py-3 px-6 bg-[#4DA5AD] text-white rounded-lg font-medium hover:bg-[#3D8B93] transition-colors"
                >
                  Return to Sign In
                </Link>
                
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="block w-full py-3 px-6 text-[#4DA5AD] hover:text-[#2D4A6B] font-medium transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Resending...' : 'Resend Email'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          🔒 Your information is protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;