import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          
          {/* Logo/Brand - Left */}
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="TaskFlow" 
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain" 
            />
            <span className="text-xl font-bold bg-gradient-to-r from-[#2D4A6B] to-[#4DA5AD] bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <a 
              href="#home" 
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-[#4DA5AD] hover:bg-gray-50/80 transition-all duration-200"
            >
              Home
            </a>
            <a 
              href="#features" 
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-[#4DA5AD] hover:bg-gray-50/80 transition-all duration-200"
            >
              Features
            </a>
            <a 
              href="#solutions" 
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-[#4DA5AD] hover:bg-gray-50/80 transition-all duration-200"
            >
              Solutions
            </a>
          </div>

          {/* Desktop Auth Buttons - Right */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/login"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-[#4DA5AD] transition-colors duration-200"
            >
              Sign in
            </Link>
            <Link 
              to="/signup"
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-lg hover:shadow-lg hover:shadow-[#4DA5AD]/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-[#4DA5AD] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4DA5AD]/20 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg py-4 px-4 md:hidden z-40 animate-fadeIn">
              <div className="flex flex-col space-y-2">
                <a 
                  href="#home" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-700 hover:text-[#4DA5AD] hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  Home
                </a>
                <a 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-700 hover:text-[#4DA5AD] hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  Features
                </a>
                <a 
                  href="#solutions" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-700 hover:text-[#4DA5AD] hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  Solutions
                </a>
                <div className="border-t border-gray-100 my-2 pt-4 flex flex-col gap-2">
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-center text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    Sign in
                  </Link>
                  <Link 
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-center text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;