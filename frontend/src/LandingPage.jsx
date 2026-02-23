import React from 'react';
import Navbar from './Component/landing/Navbar';
import HeroSection from './Component/landing/HeroSection';
import Footer from './Component/landing/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 overflow-x-hidden w-full max-w-full">
      <Navbar />
      <HeroSection />
      <Footer />
    </div>
  );
};

export default LandingPage;