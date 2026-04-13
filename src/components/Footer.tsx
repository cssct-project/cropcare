import React from 'react';
import { Leaf, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-300 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Leaf className="h-6 w-6 text-green-500" />
              <span className="text-xl font-bold text-white">CropCare</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-sm">
              Empowering African farmers with AI-driven crop disease detection. Identify issues instantly, get treatment recommendations, and secure your yield.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/#about" className="hover:text-green-500 transition-colors">About Us</a></li>
              <li><a href="/#how-it-works" className="hover:text-green-500 transition-colors">How It Works</a></li>
              <li><a href="/#pricing" className="hover:text-green-500 transition-colors">Pricing</a></li>
              <li><Link to="/login" className="hover:text-green-500 transition-colors">Log In</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-center">
                <Mail className="h-5 w-5 text-green-500 mr-3" />
                <a href="mailto:info@edutech.com.ng" className="hover:text-green-500 transition-colors">info@edutech.com.ng</a>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 text-green-500 mr-3" />
                <a href="https://wa.me/2348051555130" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition-colors">+2348051555130 (WhatsApp)</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} CropCare by EduTech. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
