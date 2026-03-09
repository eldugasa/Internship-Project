// src/auth/Signup.jsx
import { useActionState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Validation functions
const isEmail = (value) => value.includes('@') && value.includes('.');
const isNotEmpty = (value) => value.trim() !== '';
const hasMinLength = (value, minLength) => value.length >= minLength;
const isEqualToOtherValue = (value1, value2) => value1 === value2;

// NEW: Validate that name contains only letters and spaces
const isValidName = (value) => {
  if (!isNotEmpty(value)) return false;
  // Regular expression: only letters and spaces, at least 2 characters
  const nameRegex = /^[A-Za-z\s]{2,50}$/;
  return nameRegex.test(value.trim());
};

// NEW: Validate that name has at least first and last name
const hasFirstAndLastName = (value) => {
  const trimmed = value.trim();
  const parts = trimmed.split(/\s+/);
  return parts.length >= 2 && parts.every(part => part.length >= 2);
};

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const signupAction = async (prevFormState, formData) => {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    let errors = [];

    // Validate Full Name
    if (!isNotEmpty(name)) {
      errors.push("Please enter your full name.");
    } else if (!isValidName(name)) {
      errors.push("Name can only contain letters and spaces.");
    } else if (!hasFirstAndLastName(name)) {
      errors.push("Please enter both your first and last name.");
    }

    // Validate Email
    if (!isEmail(email)) {
      errors.push("Please enter a valid email address.");
    }

    // Validate Password
    if (!isNotEmpty(password) || !hasMinLength(password, 6)) {
      errors.push("Password must be at least 6 characters long.");
    }

    // Validate Confirm Password
    if (!isEqualToOtherValue(password, confirmPassword)) {
      errors.push("Passwords do not match.");
    }

    // If validation fails, return errors and entered values
    if (errors.length > 0) {
      return {
        errors,
        enteredValues: {
          name,
          email,
          password,
          confirmPassword
        },
        success: false
      };
    }

    // Validation passed - call API
    try {
      const result = await signup({ name, email, password });
      
      if (result.success) {
        return {
          errors: null,
          success: true,
          message: 'Account created successfully!'
        };
      } else {
        return {
          errors: [result.error || 'Signup failed. Please try again.'],
          enteredValues: { name, email, password, confirmPassword },
          success: false
        };
      }
    } catch (err) {
      return {
        errors: ['Signup failed. Please try again.'],
        enteredValues: { name, email, password, confirmPassword },
        success: false
      };
    }
  };

  const [formState, formAction, isPending] = useActionState(signupAction, {
    errors: null,
    enteredValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    success: false
  });

  // Redirect on success
  if (formState.success) {
    navigate('/team-member/dashboard');
  }

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

        

          {/* Success Message */}
          {formState.success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-green-700">{formState.message}</p>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D4A6B] mb-2">
                Full Name
              </label>
              <input
                name="name"
                placeholder="Elias Dugasa"
                defaultValue={formState.enteredValues?.name}
                className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your first and last name (letters only)
              </p>
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
                defaultValue={formState.enteredValues?.email}
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
                  minLength="6"
                  defaultValue={formState.enteredValues?.password}
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
                  defaultValue={formState.enteredValues?.confirmPassword}
                  className="w-full px-5 py-3.5 bg-gray-50/50 border-2 border-gray-200 rounded-xl focus:border-[#4DA5AD] focus:ring-4 focus:ring-[#4DA5AD]/20 outline-none"
                />
              </div>
            </div>
              {/* Error Display */}
          {formState.errors && formState.errors.length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200">
              <ul className="list-disc list-inside text-red-700">
                {formState.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
              {formState.errors.some(e => e.includes('already registered')) && (
                <Link to="/login" className="text-sm font-semibold text-[#4DA5AD] block mt-2">
                  → Go to Login
                </Link>
              )}
            </div>
          )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 px-6 text-lg font-bold text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isPending ? 'Creating Account...' : 'Sign Up'}
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