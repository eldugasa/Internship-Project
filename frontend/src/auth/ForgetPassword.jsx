import { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] rounded-2xl flex items-center justify-center shadow-xl shadow-[#4DA5AD]/20">
              <div className="w-10 h-10 bg-white/95 rounded-xl"></div>
            </div>
          </div>
          <h1 className="text-3xl font-black text-[#2D4A6B] mb-3">
            Reset Password
          </h1>
          <p className="text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100">
          {!isSubmitted ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 text-lg font-bold text-white bg-gradient-to-r from-[#4DA5AD] via-[#3D95A3] to-[#2D4A6B] rounded-xl hover:shadow-2xl hover:shadow-[#4DA5AD]/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                  ← Back to Sign In
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl text-green-600">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h3>
              <p className="text-gray-600 mb-6">
                We've sent a password reset link to{' '}
                <span className="font-semibold text-[#2D4A6B]">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-8">
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block py-3 px-6 bg-[#4DA5AD] text-white rounded-lg font-medium hover:opacity-90 transition"
                >
                  Return to Sign In
                </Link>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="block py-3 px-6 text-[#4DA5AD] hover:text-[#2D4A6B] font-medium"
                >
                  Resend Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;