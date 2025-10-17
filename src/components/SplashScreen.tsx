import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Header from './Header';
import '../styles/SplashScreen.css';
import BgImage from './bg_image.png';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Trigger animations on mount
    const timer = setTimeout(() => setIsLoaded(true), 100);

    // Handle scroll indicator
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleNavigate = () => {
    navigate('/submission');
  };

  return (
    <div className="relative min-h-screen">
      {/* Header Component - Must be first for sticky positioning */}
      <div className="relative z-50">
        <Header showAdminLogin={true} />
      </div>

      {/* Library Background Image */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${BgImage})`}}
        />
        {/* Enhanced overlay for better text readability with warm tones */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 min-h-screen flex items-center -mt-16 pt-16">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="max-w-3xl">
            {/* Side dots indicator */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col space-y-3">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
              <div className="w-2 h-2 rounded-full bg-white/40"></div>
            </div>

            {/* Main heading */}
            <h1 className={`font-bold tracking-wide transition-all duration-1000 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <span className="text-6xl md:text-7xl lg:text-8xl block leading-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                ACADEMIC
              </span>
              <span className="text-6xl md:text-7xl lg:text-8xl block leading-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                ARCHIVE
              </span>
            </h1>

            {/* Subtitle */}
            <div className={`mt-8 transition-all duration-1000 delay-300 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <h2 className="text-white text-xl md:text-2xl font-semibold mb-4 tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                AN ARCHIVE EVERYONE DESERVES
              </h2>
              <p className="text-white text-base md:text-lg font-normal leading-relaxed max-w-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] bg-black/20 backdrop-blur-sm p-4 rounded-lg border border-white/10">
                Discover a comprehensive digital repository of academic excellence. 
                From groundbreaking research to innovative theses, our archive preserves 
                and shares knowledge that shapes the future. Join thousands of scholars 
                in building the ultimate academic resource.
              </p>
            </div>

            {/* CTA Button */}
            <div className={`mt-10 transition-all duration-1000 delay-500 ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
              <button
                onClick={handleNavigate}
                className="group relative inline-flex items-center px-8 py-4 bg-white/95 backdrop-blur-md text-gray-900 border-2 border-white rounded-lg hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.3)]"
              >
                <span className="font-semibold tracking-wide text-sm uppercase">
                  Go to Submission Form
                </span>
                <svg 
                  className="w-5 h-5 ml-3 transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-500 ${
        scrolled ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex flex-col items-center space-y-2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/60" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;