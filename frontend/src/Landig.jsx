import React from 'react';
import { Link } from 'react-router-dom';
// Signup is rendered on its own route; not imported here

const LandingPage = () => {
  return (
    <div className="min-h-screen bg- font-sans text-slate-800">
      {/* --- NAVIGATION --- */}
     <nav className="flex justify-between items-center px-6 md:px-16 py-5 bg-gradient-to-r from-white/95 via-blue-50/95 to-white/95 backdrop-blur-lg sticky top-0 z-50 border-b border-blue-100/50 shadow-sm">
  {/* Logo/Brand */}
  <div className="flex items-center gap-3">
    
    <a href="#home" className="hover:text-[#4DA5AD] transition-colors duration-300 relative group">
      Home
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] group-hover:w-full transition-all duration-300"></span>
    </a>
  </div>
  
  {/* Navigation Links */} <div className='flex justify-between items-center'>
  <div className="hidden md:flex space-x-10 font-semibold text-sm text-gray-600">
    <a href="#features" className="hover:text-[#4DA5AD] transition-colors duration-300 relative group">
      Features
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] group-hover:w-full transition-all duration-300"></span>
    </a>
    <a href="#solutions" className="hover:text-[#4DA5AD] transition-colors duration-300 relative group">
      Solutions
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] group-hover:w-full transition-all duration-300"></span>
    </a>
  </div>

  {/* Auth Buttons */}
  <div className="m flex gap-4">
    <Link 
      to="/login"
      className="px-5 py-2.5 text-sm font-semibold cursor-pointer text-[#2D4A6B] hover:text-[#4DA5AD] transition-colors hover:bg-gray-50/80 rounded-lg">
      Login
    </Link>
    <Link 
      to="/signup"
      className="px-6 py-2.5 text-sm font-semibold cursor-pointer text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-[#4DA5AD]/30 inline-block text-center"
    >
      Get Started
    </Link>
  </div>
  </div>
</nav>

      {/* --- HERO SECTION --- */}
      <header id="home" className="px-8 md:px-16 py-20 bg-white heigth-100vh overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#4DA5AD]/10 to-[#2D4A6B]/10 border border-[#4DA5AD]/20 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-[#4DA5AD]"></span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4DA5AD]">
                Built for Engineering Excellence
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-[#2D4A6B] leading-[1.1] mb-6">
              Precision Project
              <br />
              <span className="text-[#4DA5AD]">Management for</span>
              <br />
              Companies
            </h1>
            
            <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              The all-in-one platform for engineering companies to plan work, 
              manage teams, assign tasks, and track progress. Replace manual 
              tools with a single digital ecosystem.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link 
      to="/signup"
      className="px-6 py-2.5 text-sm font-semibold cursor-pointer text-white bg-gradient-to-r from-[#4DA5AD] to-[#2D4A6B] rounded-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-[#4DA5AD]/30 inline-block text-center"
    >
      Get Started
    </Link>
              
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center lg:justify-start gap-8 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#2D4A6B]">500+</div>
                <div className="text-sm text-slate-500">Engineering Teams</div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#2D4A6B]">95%</div>
                <div className="text-sm text-slate-500">On-time Delivery</div>
              </div>
              <div className="h-8 w-px bg-slate-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[#2D4A6B]">24/7</div>
                <div className="text-sm text-slate-500">Support</div>
              </div>
            </div>
          </div>

          {/* Hero Image Container with Gradient Overlay */}
          <div className="flex-1 relative w-full max-w-2xl lg:max-w-none">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#4DA5AD]/20 rounded-full blur-3xl opacity-60"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#2D4A6B]/20 rounded-full blur-3xl opacity-40"></div>
            
            <div className="relative z-10 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-gradient-to-br from-[#4DA5AD]/5 via-white to-[#2D4A6B]/5 p-1">
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#4DA5AD]/20 via-transparent to-[#2D4A6B]/20 rounded-2xl"></div>
              
              {/* Main Dashboard Image with Gradient Overlay */}
              <div className="relative rounded-xl overflow-hidden">
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D4A6B]/40 via-transparent to-transparent z-10"></div>
                
                {/* Dashboard UI Elements */}
                <div className="relative bg-white/50 backdrop-blur-sm p-6 rounded-t-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="ml-3 font-semibold text-[#2D4A6B]">Engineering Dashboard</span>
                    </div>
                    <div className="px-3 py-1 bg-[#4DA5AD]/10 text-[#4DA5AD] text-sm font-medium rounded-full">
                      Active Project
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-white/80 rounded-lg border border-slate-100">
                      <div className="text-sm text-slate-500 mb-1">Progress</div>
                      <div className="text-2xl font-bold text-[#2D4A6B]">78%</div>
                    </div>
                    <div className="p-4 bg-white/80 rounded-lg border border-slate-100">
                      <div className="text-sm text-slate-500 mb-1">Tasks</div>
                      <div className="text-2xl font-bold text-[#2D4A6B]">42/54</div>
                    </div>
                  </div>
                </div>
                
                {/* Task List Section */}
                <div className="bg-white p-6 rounded-b-xl">
                  <div className="space-y-3">
                    {[
                      { task: 'API Integration', status: 'complete', team: 'Backend' },
                      { task: 'UI Redesign', status: 'progress', team: 'Frontend' },
                      { task: 'Database Migration', status: 'pending', team: 'DevOps' },
                      { task: 'Testing Suite', status: 'blocked', team: 'QA' }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-50/80 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            item.status === 'complete' ? 'bg-green-500' :
                            item.status === 'progress' ? 'bg-[#4DA5AD]' :
                            item.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className="font-medium text-[#2D4A6B]">{item.task}</span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">
                            {item.team}
                          </span>
                        </div>
                        <div className={`px-2 py-1 text-xs font-medium rounded ${
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
              
              {/* Floating Status Card */}
              <div className="absolute -bottom-6 -right-6 gradient-to-r from-white/95 via-blue-50/95 to-white/95  p-4 rounded-xl shadow-xl border border-slate-100/50 hidden md:block animate-float backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4DA5AD] to-[#2D4A6B] flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter"></p>
                    <p className="text-sm font-bold text-[#2D4A6B]">+24% This Sprint</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="px-8 py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="h-px w-8 bg-[#4DA5AD]"></span>
            <span className="text-sm font-bold uppercase tracking-widest text-[#4DA5AD]">Features</span>
            <span className="h-px w-8 bg-[#4DA5AD]"></span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#2D4A6B] mb-6">
            Engineered for <span className="text-[#4DA5AD]">Precision</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Everything you need to manage  projects with accuracy and efficiency
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <FeatureCard 
            icon={
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/10 to-[#2D4A6B]/10 flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
            }
            title="Role Control" 
            desc="Define Admins, Managers, and Members with granular access permissions for secure collaboration." 
          />
          <FeatureCard 
            icon={
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/20 via-[#4DA5AD]/10 to-[#2D4A6B]/20 flex items-center justify-center border border-[#4DA5AD]/20 shadow-sm">
  <span className="text-2xl">📊</span>
</div>
            }
            title="Live Progress" 
            desc="Track task completion percentage in real-time with interactive dashboards and automated reports." 
          />
          <FeatureCard 
            icon={
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/10 to-[#2D4A6B]/10 flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            }
            title="Team Hubs" 
            desc="Create specialized teams and assign them to specific engineering projects with instant synchronization." 
          />
          <FeatureCard 
            icon={
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4DA5AD]/10 to-[#2D4A6B]/10 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
            }
            title="Automated Workflows" 
            desc="Streamline engineering processes with automated notifications, reminders, and progress tracking." 
          />
        </div>
      </section>

      {/* --- SOLUTIONS SECTION --- */}
      <section id="solutions" className="px-8 py-24 bg-gradient-to-b from-white to-slate-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-[#4DA5AD]"></span>
              <span className="text-sm font-bold uppercase tracking-widest text-[#4DA5AD]">Solutions</span>
              <span className="h-px w-8 bg-[#4DA5AD]"></span>
            </div>
            <h2 className="text-4xl font-black text-[#2D4A6B] mb-6">Standardize Your Engineering Workflow</h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Replace manual tools like Excel sheets, paper-based tracking, and messy communication apps 
              with a unified digital platform designed specifically for engineering organizations.
            </p>
            <ul className="space-y-4 mb-10">
               {[
                 'Define clear user roles and permissions',
                 'Monitor task deadlines and dependencies',
                 'Update status and progress in real-time',
                 'Generate comprehensive project reports',
                 'Collaborate across multiple engineering teams'
               ].map((item, index) => (
                 <li key={index} className="flex items-center gap-3 font-medium text-[#2D4A6B]">
                   <div className="w-6 h-6 rounded-full bg-[#4DA5AD]/10 flex items-center justify-center flex-shrink-0">
                     <span className="text-[#4DA5AD]">✓</span>
                   </div> 
                   {item}
                 </li>
               ))}
            </ul>
            
          </div>
          
          {/* Metrics Card with Gradient */}
          <div className="flex-1 relative">
            <div className="relative bg-gradient-to-br from-[#2D4A6B] via-[#2D4A6B]/90 to-[#4DA5AD] rounded-2xl p-8 shadow-2xl overflow-hidden">
              {/* Gradient Pattern Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
              
              <div className="relative z-10 text-white">
                <h3 className="text-2xl font-bold mb-8">Team Performance Metrics</h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-300">Project Delivery</span>
                      <span className="text-[#4DA5AD] font-bold">+32%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4DA5AD] to-teal-400 w-4/5"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-300">Code Quality</span>
                      <span className="text-[#4DA5AD] font-bold">+18%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4DA5AD] to-teal-400 w-3/4"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-slate-300">Team Efficiency</span>
                      <span className="text-[#4DA5AD] font-bold">+45%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4DA5AD] to-teal-400 w-5/6"></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-sm text-slate-300 text-center">
                    Average improvement across 50+ engineering teams
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating Element */}
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-[#4DA5AD] to-teal-300 rounded-xl -rotate-12 shadow-lg"></div>
          </div>
        </div>
      </section>

      

      {/* --- FOOTER --- */}
      <footer className="bg-[#1a2a3a] text-white py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center md:text-left">
                <h4 className="font-bold mb-4 text-slate-300">Product</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#solutions" className="hover:text-white transition-colors">Solutions</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              
              <div className="text-center md:text-left">
                <h4 className="font-bold mb-4 text-slate-300">Company</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#blog" className="hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>
              
              <div className="text-center md:text-left">
                <h4 className="font-bold mb-4 text-slate-300">Support</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#privacy" className="hover:text-white transition-colors">Privacy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>© 2024. The digital core for modern engineering teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 border border-slate-100  bg-gradient-to-br from-[#4DA5AD]/20 via-[#4DA5AD]/10 to-[#2D4A6B]/20 rounded-2xl hover:shadow-xl transition-all hover:-translate-y-2 duration-300 bg-white group hover:border-[#4DA5AD]/20">
    <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-[#2D4A6B] mb-3 group-hover:text-[#4DA5AD] transition-colors">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;