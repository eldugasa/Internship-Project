import React, { useState } from 'react';
import logo from './assets/logo.png';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { 
  Facebook, 
  Linkedin, 
  Send, 
  Youtube 
} from 'lucide-react';


const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden w-full max-w-full">
      {/* --- NAVIGATION --- */}
      <nav className="flex justify-between items-center px-4 sm:px-6 md:px-16 py-4 bg-gradient-to-r from-white/95 via-blue-50/95 to-white/95 backdrop-blur-lg sticky top-0 z-50 border-b border-blue-100/50 shadow-sm w-full">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <img src={logo} alt="Company Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
          <a href="#home" className="hidden sm:block text-sm sm:text-base hover:text-[#4DA5AD] transition-colors duration-300 relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] group-hover:w-full transition-all duration-300"></span>
          </a>
        </div>
        
        {/* Desktop Navigation Links */}
        <div className="hidden md:flex space-x-8 lg:space-x-10 font-semibold text-sm text-gray-600">
          <a href="#features" className="hover:text-[#4DA5AD] transition-colors duration-300 relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] group-hover:w-full transition-all duration-300"></span>
          </a>
          <a href="#solutions" className="hover:text-[#4DA5AD] transition-colors duration-300 relative group">
            Solutions
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] group-hover:w-full transition-all duration-300"></span>
          </a>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <Link 
            to="/login"
            className="px-4 lg:px-5 py-2 text-sm font-semibold text-[#2D4A6B] hover:text-[#4DA5AD] transition-colors hover:bg-gray-50/80 rounded-lg">
            Login
          </Link>
          <Link 
            to="/signup"
            className="px-4 lg:px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-[#4DA5AD]/30"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6 text-[#2D4A6B]" />
          ) : (
            <Menu className="w-6 h-6 text-[#2D4A6B]" />
          )}
        </button>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg p-4 md:hidden z-50">
            <div className="flex flex-col space-y-4">
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                Features
              </a>
              <a 
                href="#solutions" 
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                Solutions
              </a>
              <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
                <Link 
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-center text-[#2D4A6B] border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Login
                </Link>
                <Link 
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-center text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-lg hover:shadow-lg transition"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <header id="home" className="px-4 sm:px-6 md:px-16 py-12 sm:py-16 md:py-20 bg-white overflow-hidden w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12 w-full">
          
          {/* Hero Content */}
          <div className="flex-1 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#4DA5AD]/10 to-[#2D4A6B]/10 border border-[#4DA5AD]/20 mb-4 sm:mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#4DA5AD]"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4DA5AD]">
                Built for Engineering Excellence
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#2D4A6B] leading-tight mb-4 sm:mb-6">
              Precision Project
              <br />
              <span className="text-[#4DA5AD]">Management for</span>
              <br />
              Companies
            </h1>
            
            <p className="text-base sm:text-lg text-slate-500 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              The all-in-one platform for engineering companies to plan work, 
              manage teams, assign tasks, and track progress.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-8 sm:mb-10">
              <Link 
                to="/signup"
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg"
              >
                Get Started
              </Link>
            </div>

            {/* Stats - Responsive Grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-12">
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#2D4A6B]">50+</div>
                <div className="text-xs sm:text-sm text-slate-500">Teams</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#2D4A6B]">95%</div>
                <div className="text-xs sm:text-sm text-slate-500">On-time</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#2D4A6B]">24/7</div>
                <div className="text-xs sm:text-sm text-slate-500">Support</div>
              </div>
            </div>
          </div>

          {/* Hero Image - Responsive */}
          <div className="flex-1 relative w-full max-w-2xl lg:max-w-none order-1 lg:order-2 mb-8 lg:mb-0">
            <div className="absolute -top-10 -right-10 w-48 sm:w-64 h-48 sm:h-64 bg-[#4DA5AD]/20 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -bottom-10 -left-10 w-32 sm:w-48 h-32 sm:h-48 bg-[#2D4A6B]/20 rounded-full blur-3xl opacity-40"></div>
            
            <div className="relative z-10 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden bg-gradient-to-br from-[#4DA5AD]/5 via-white to-[#2D4A6B]/5 p-1">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4DA5AD]/20 via-transparent to-[#2D4A6B]/20 rounded-xl sm:rounded-2xl"></div>
              
              {/* Dashboard Preview */}
              <div className="relative rounded-lg sm:rounded-xl overflow-hidden">
                <div className="relative bg-white/50 backdrop-blur-sm p-3 sm:p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                      <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-semibold text-[#2D4A6B]">Dashboard</span>
                    </div>
                    <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#4DA5AD]/10 text-[#4DA5AD] text-[10px] sm:text-xs font-medium rounded-full">
                      Active
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
                    <div className="p-2 sm:p-3 md:p-4 bg-white/80 rounded-lg border border-slate-100">
                      <div className="text-[10px] sm:text-xs text-slate-500 mb-1">Progress</div>
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#2D4A6B]">78%</div>
                    </div>
                    <div className="p-2 sm:p-3 md:p-4 bg-white/80 rounded-lg border border-slate-100">
                      <div className="text-[10px] sm:text-xs text-slate-500 mb-1">Tasks</div>
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-[#2D4A6B]">42/54</div>
                    </div>
                  </div>
                </div>
                
                {/* Task List - Responsive */}
                <div className="bg-white p-3 sm:p-4 md:p-6">
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { task: 'API Integration', status: 'complete', team: 'Backend' },
                      { task: 'UI Redesign', status: 'progress', team: 'Frontend' },
                      { task: 'Database Migration', status: 'pending', team: 'DevOps' },
                      { task: 'Testing Suite', status: 'blocked', team: 'QA' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center justify-between p-2 sm:p-3 hover:bg-slate-50/80 rounded-lg transition-colors gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
                            item.status === 'complete' ? 'bg-green-500' :
                            item.status === 'progress' ? 'bg-[#4DA5AD]' :
                            item.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-xs sm:text-sm font-medium text-[#2D4A6B] truncate">{item.task}</span>
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-600 text-[8px] sm:text-xs rounded flex-shrink-0">
                            {item.team}
                          </span>
                        </div>
                        <div className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-medium rounded flex-shrink-0 ${
                          item.status === 'complete' ? 'bg-green-100 text-green-800' :
                          item.status === 'progress' ? 'bg-[#4DA5AD]/10 text-[#4DA5AD]' :
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating Card - Fixed positioning */}
              <div className="hidden lg:block absolute -bottom-6 -right-4 lg:-right-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100/50 animate-float backdrop-blur-sm max-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] flex items-center justify-center text-white flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 truncate">Sprint Velocity</p>
                    <p className="text-sm font-bold text-[#2D4A6B]">+24% This Sprint</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="px-4 sm:px-6 md:px-16 py-16 sm:py-20 md:py-24 bg-white scroll-mt-20 w-full">
        <div className="max-w-7xl mx-auto text-center mb-12 sm:mb-16 w-full">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-px w-6 sm:w-8 bg-[#4DA5AD]"></span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#4DA5AD]">Features</span>
            <span className="h-px w-6 sm:w-8 bg-[#4DA5AD]"></span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#2D4A6B] mb-4 sm:mb-6">
            Engineered for <span className="text-[#4DA5AD]">Precision</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-500 max-w-2xl mx-auto px-4">
            Everything you need to manage projects with accuracy and efficiency
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto px-4 sm:px-0 w-full">
          <FeatureCard 
            icon={
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/10 to-[#2D4A6B]/10 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">👑</span>
              </div>
            }
            title="Role Control" 
            desc="Define Admins, Managers, and Members with granular access permissions." 
          />
          <FeatureCard 
            icon={
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/20 via-[#4DA5AD]/10 to-[#2D4A6B]/20 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">📊</span>
              </div>
            }
            title="Live Progress" 
            desc="Track task completion in real-time with interactive dashboards." 
          />
          <FeatureCard 
            icon={
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/10 to-[#2D4A6B]/10 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">👥</span>
              </div>
            }
            title="Team Hubs" 
            desc="Create specialized teams for specific engineering projects." 
          />
          <FeatureCard 
            icon={
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/10 to-[#2D4A6B]/10 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🚀</span>
              </div>
            }
            title="Automated Workflows" 
            desc="Streamline processes with automated notifications and tracking." 
          />
        </div>
      </section>

      {/* --- SOLUTIONS SECTION --- */}
      <section id="solutions" className="px-4 sm:px-6 md:px-16 py-16 sm:py-20 md:py-24 bg-gradient-to-b from-white to-slate-50 scroll-mt-20 w-full relative">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16 w-full relative">
          <div className="flex-1 px-4 sm:px-0">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-6 sm:w-8 bg-[#4DA5AD]"></span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#4DA5AD]">Solutions</span>
              <span className="h-px w-6 sm:w-8 bg-[#4DA5AD]"></span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#2D4A6B] mb-4 sm:mb-6">
              Standardize Your Engineering Workflow
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mb-6 sm:mb-8 leading-relaxed">
              Replace manual tools with a unified digital platform designed specifically for engineering organizations.
            </p>
            <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {[
                'Define clear user roles and permissions',
                'Monitor task deadlines and dependencies',
                'Update status and progress in real-time',
                'Generate comprehensive project reports',
                'Collaborate across multiple engineering teams'
              ].map((item, index) => (
                <li key={index} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base font-medium text-[#2D4A6B]">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#4DA5AD]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#4DA5AD] text-xs sm:text-sm">✓</span>
                  </div> 
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Metrics Card - Responsive */}
          <div className="flex-1 w-full px-4 sm:px-0 relative">
            <div className="relative bg-gradient-to-br from-[#2D4A6B] via-[#2D4A6B]/90 to-[#4DA5AD] rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
              
              <div className="relative z-10 text-white">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-6 sm:mb-8">Team Performance Metrics</h3>
                
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-2 text-xs sm:text-sm">
                      <span className="text-slate-300">Project Delivery</span>
                      <span className="text-[#4DA5AD] font-bold">+32%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4DA5AD] to-teal-400 w-4/5"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2 text-xs sm:text-sm">
                      <span className="text-slate-300">Code Quality</span>
                      <span className="text-[#4DA5AD] font-bold">+18%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4DA5AD] to-teal-400 w-3/4"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2 text-xs sm:text-sm">
                      <span className="text-slate-300">Team Efficiency</span>
                      <span className="text-[#4DA5AD] font-bold">+45%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4DA5AD] to-teal-400 w-5/6"></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/10">
                  <p className="text-xs sm:text-sm text-slate-300 text-center">
                    Average improvement across 50+ engineering teams
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating Element - Fixed positioning */}
            <div className="hidden lg:block absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-[#4DA5AD] to-teal-300 rounded-xl -rotate-12 shadow-lg"></div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#1a2a3a] text-white py-4  py-8 sm:py-3 px-4 sm:px-6 md:px-8 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          {/* Footer Content - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8 md:mb-10 w-full">
            
            {/* Product Section */}
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-4 text-slate-300 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors block py-1">Features</a></li>
                <li><a href="#solutions" className="hover:text-white transition-colors block py-1">Solutions</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors block py-1">Pricing</a></li>
              </ul>
            </div>
            
            {/* Company Section */}
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-4 text-slate-300 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li><a href="#about" className="hover:text-white transition-colors block py-1">About</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors block py-1">Careers</a></li>
                <li><a href="#blog" className="hover:text-white transition-colors block py-1">Blog</a></li>
              </ul>
            </div>
            
            {/* Support Section */}
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-4 text-slate-300 text-sm sm:text-base">Support</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
                <li><a href="#help" className="hover:text-white transition-colors block py-1">Help Center</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors block py-1">Contact</a></li>
                <li><a href="#privacy" className="hover:text-white transition-colors block py-1">Privacy</a></li>
              </ul>
            </div>
            
            {/* Contact & Social Section */}
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-4 text-slate-300 text-sm sm:text-base">Contact Info</h4>
              <div className="space-y-2 mb-6 text-xs sm:text-sm text-slate-400">
                <p className="py-1">Jimma, Ethiopia</p>
                <p className="py-1">contact@deboengineering.com</p>
                <p className="py-1">+251 94 954 0860</p>
              </div>
              
              {/* Social Media Icons */}
              <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                {/* Facebook */}
                <a 
                  href="https://facebook.com/deboengineering" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors group"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
                
                {/* LinkedIn */}
                <a 
                  href="https://www.linkedin.com/company/debo-engineering" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors group"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
                
                {/* Telegram */}
                <a 
                  href="#" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors group"
                  aria-label="Telegram"
                >
                  <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
                
                {/* YouTube */}
                <a 
                  href="https://www.youtube.com/channel/UCSFW4-JLb7X5Y8-ThBX5NFg" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors group"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Bottom Copyright */}
          <div className="border-t border-slate-700 pt-4 text-center text-slate-400 text-xs sm:text-sm w-full">
            <p>© 2026 TaskFlow. The digital core for modern engineering teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-4 sm:p-6 md:p-6 border border-slate-100 bg-gradient-to-br from-[#4DA5AD]/20 via-[#4DA5AD]/10 to-[#2D4A6B]/20 rounded-xl sm:rounded-2xl hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 bg-white group">
    <div className="mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#2D4A6B] mb-2 sm:mb-3 group-hover:text-[#4DA5AD] transition-colors">
      {title}
    </h3>
    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{desc}</p>
  </div>
);



export default LandingPage;