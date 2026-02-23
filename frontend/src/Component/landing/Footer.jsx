import React from 'react';
import { Facebook, Linkedin, Send, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1a2a3a] text-white py-12 sm:py-16 px-4 sm:px-6 md:px-8 w-full overflow-hidden">
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
              <a 
                href="https://facebook.com/deboengineering" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors group"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
              
              <a 
                href="https://www.linkedin.com/company/debo-engineering" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
              
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors group"
                aria-label="Telegram"
              >
                <Send className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </a>
              
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
        <div className="border-t border-slate-700 pt-6 text-center text-slate-400 text-xs sm:text-sm w-full">
          <p>© 2026 TaskFlow. The digital core for modern engineering teams.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;