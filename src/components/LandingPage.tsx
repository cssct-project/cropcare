import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ShieldCheck, TrendingUp, Mic, CheckCircle2, ArrowRight, ArrowUp, Menu, X } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';
import Footer from './Footer';

export default function LandingPage() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowTopBtn(true);
      } else {
        setShowTopBtn(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-green-100 shadow-sm">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-800">CropCare</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <a href="#about" className="text-gray-600 hover:text-green-600 font-medium">About</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-green-600 font-medium">How it Works</a>
            <a href="#benefits" className="text-gray-600 hover:text-green-600 font-medium">Benefits</a>
            <a href="#pricing" className="text-gray-600 hover:text-green-600 font-medium">Pricing</a>
            <a href="#support" className="text-gray-600 hover:text-green-600 font-medium">Support</a>
          </div>
          
          {/* Desktop Auth */}
          <div className="hidden md:flex space-x-4">
            <Link to="/login" className="px-4 py-2 text-green-600 font-medium hover:text-green-700 border border-green-600 rounded-lg">Log In</Link>
            <Link to="/signup" className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">Sign Up</Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="text-gray-600 hover:text-green-600 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-green-100 shadow-lg">
            <div className="flex flex-col px-6 py-4 space-y-4">
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 font-medium">About</a>
              <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 font-medium">How it Works</a>
              <a href="#benefits" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 font-medium">Benefits</a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 font-medium">Pricing</a>
              <a href="#support" onClick={() => setIsMobileMenuOpen(false)} className="text-gray-600 hover:text-green-600 font-medium">Support</a>
              <div className="border-t border-gray-100 pt-4 flex flex-col space-y-4">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-center px-4 py-2 text-green-600 font-medium hover:text-green-700 border border-green-600 rounded-lg">Log In</Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="text-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">Sign Up</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 opacity-20"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        ></div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-4 md:mb-6">
            Detect Crop Diseases <span className="text-green-600">Early.</span><br />
            Save Your Harvest.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 font-medium mb-8 md:mb-10 max-w-2xl mx-auto">
            Empowering African farmers with AI-driven crop disease detection. Identify issues instantly, get treatment recommendations, and secure your yield.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/login" className="px-8 py-4 bg-green-600 text-white font-bold rounded-full text-lg hover:bg-green-700 transition-colors flex items-center shadow-lg shadow-green-200">
              Start Diagnosis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <a href="#support" className="px-8 py-4 bg-green-600 text-white font-bold rounded-full text-lg hover:bg-green-700 transition-colors flex items-center shadow-lg shadow-green-200">
              Talk To Support <Mic className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-green-50 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About CropCare</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              In Nigeria and across Africa, farmers lose up to 40% of their crops annually due to late disease detection. CropCare is built to bridge this gap. Using advanced Artificial Intelligence, we provide an accessible, fast, and accurate diagnostic tool right from your mobile phone, ensuring food security and protecting your income.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Snap a Photo</h3>
              <p className="text-gray-600">Take a clear picture of the affected crop leaf using your smartphone camera.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">AI Analysis</h3>
              <p className="text-gray-600">Our AI instantly analyzes the image to identify the specific disease or pest.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Get Treatment</h3>
              <p className="text-gray-600">Receive actionable, locally-available treatment recommendations immediately.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-green-600 text-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16">Benefits for Farmers</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-green-700 p-8 rounded-2xl">
              <ShieldCheck className="h-12 w-12 text-green-300 mb-6" />
              <h3 className="text-xl font-bold mb-4">Reduce Crop Loss</h3>
              <p className="text-green-100">Catch diseases early before they spread, saving up to 40% of your annual harvest.</p>
            </div>
            <div className="bg-green-700 p-8 rounded-2xl">
              <TrendingUp className="h-12 w-12 text-green-300 mb-6" />
              <h3 className="text-xl font-bold mb-4">Increase Income</h3>
              <p className="text-green-100">Healthier crops mean better yields and higher market value for your produce.</p>
            </div>
            <div className="bg-green-700 p-8 rounded-2xl">
              <Leaf className="h-12 w-12 text-green-300 mb-6" />
              <h3 className="text-xl font-bold mb-4">Sustainable Farming</h3>
              <p className="text-green-100">Apply the right treatments at the right time, reducing unnecessary chemical use.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Voice Assistant */}
      <section id="support" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-12 w-full">
            <VoiceAssistant />
          </div>
          <div className="md:w-1/2 w-full">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium mb-6">
              <Mic className="h-5 w-5 mr-2" /> New Feature
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">AI Voice Assistant Support</h2>
            <p className="text-lg text-gray-600 mb-6">
              Not comfortable typing? Speak directly to our AI Voice Assistant in your local language. Ask questions about crop health, weather patterns, or treatment instructions, and get instant voice responses.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-700"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Supports multiple local dialects</li>
              <li className="flex items-center text-gray-700"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Hands-free operation in the field</li>
              <li className="flex items-center text-gray-700"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Accessible to all literacy levels</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">Pricing Plans</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="border border-green-600 rounded-3xl p-8 hover:shadow-xl transition-shadow bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Free</h3>
              <div className="text-4xl font-extrabold text-gray-900 mb-6">₦0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> 5 AI Diagnoses per month</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Basic treatment guides</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Community forum access</li>
              </ul>
              <Link to="/signup" className="block w-full py-3 px-4 bg-green-50 text-green-700 border border-green-600 font-bold text-center rounded-xl hover:bg-green-100 transition-colors">Get Started</Link>
            </div>
            {/* Basic */}
            <div className="border-2 border-green-600 rounded-3xl p-8 shadow-xl bg-white relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Basic</h3>
              <div className="text-4xl font-extrabold text-gray-900 mb-6">₦1,500<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> 50 AI Diagnoses per month</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Premium treatment guides</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Weather alerts</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Voice Assistant (Limited)</li>
              </ul>
              <Link to="/signup" className="block w-full py-3 px-4 bg-green-600 text-white font-bold text-center rounded-xl hover:bg-green-700 transition-colors">Start Basic</Link>
            </div>
            {/* Standard */}
            <div className="border border-green-600 rounded-3xl p-8 hover:shadow-xl transition-shadow bg-white">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Standard</h3>
              <div className="text-4xl font-extrabold text-gray-900 mb-6">₦4,000<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Unlimited AI Diagnoses</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Expert agronomist chat</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Unlimited Voice Assistant</li>
                <li className="flex items-center text-gray-600"><CheckCircle2 className="h-5 w-5 text-green-500 mr-3" /> Market price trends</li>
              </ul>
              <Link to="/signup" className="block w-full py-3 px-4 bg-green-50 text-green-700 border border-green-600 font-bold text-center rounded-xl hover:bg-green-100 transition-colors">Start Standard</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-gray-900 text-white py-20 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Ready to protect your harvest?</h2>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto">Join thousands of farmers across Africa who are using CropCare to secure their yields and increase their income.</p>
          <Link to="/signup" className="inline-block px-8 py-4 bg-green-600 text-white font-bold rounded-full text-lg hover:bg-green-500 transition-colors">
            Create Free Account
          </Link>
        </div>
      </section>

      <Footer />

      {/* Back to Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all z-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="Back to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
