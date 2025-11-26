import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from './Header';
import LoginModal from './LoginModal';
import { useAuth } from '../hooks/useAuth';
import '../styles/SplashScreen.css';
import BgImage from './bg_image.png';
import ClickSpark from './ClickSpark';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { user, loading, isVerifying } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const backgroundImages = React.useMemo(() => [
    "https://i.imgur.com/AxPuJH1.jpeg",
    "https://i.imgur.com/6ZUmipU.jpeg",
    "https://i.imgur.com/9A2QqiQ.jpeg"
  ], []);

  // Auto-redirect authenticated users to submission page
  // BUT only if they're not in the middle of 2FA verification
  useEffect(() => {
    if (!loading && user && !isVerifying) {
      console.log('✅ User authenticated on splash screen, redirecting to submission...');
      navigate('/submission');
    }
  }, [user, loading, isVerifying, navigate]);

  useEffect(() => {
    // Trigger animations on mount
    const timer = setTimeout(() => setIsLoaded(true), 100);

    // Slideshow effect
    const slideshowInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(slideshowInterval);
    };
  }, [backgroundImages]);

  const handleNavigate = () => {
    navigate('/submission');
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  return (
    <motion.div
      className="relative min-h-screen"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.4, ease: "easeInOut" }
      }}
    >
      {/* Header Component - Must be first for sticky positioning */}
      <div className="relative z-50">
        <Header showAdminLogin={true} onAdminLoginClick={handleLoginClick} />
      </div>

      {/* Library Background Image with Slideshow */}
      <div className="fixed inset-0 z-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
            style={{
              backgroundImage: `url(${image})`,
              opacity: currentImageIndex === index ? 1 : 0,
              zIndex: currentImageIndex === index ? 1 : 0
            }}
          />
        ))}
        {/* Enhanced overlay for better text readability with warm tones */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/35 to-black/30 z-10" />
        <div className="absolute inset-0 bg-black/20 z-10" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center -mt-16 pt-16">
        {/* Animated decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse-slow" />
        </div>

        <div className="container mx-auto px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main heading with gradient */}
            <h1 className={`font-bold tracking-tight transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
              <span className="text-4xl md:text-5xl lg:text-6xl block leading-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                Integrated Digital Repository for LPU-Batangas Theses and Dissertations
              </span>
            </h1>

            {/* Decorative divider */}
            <div className={`flex items-center justify-center gap-3 my-6 transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/50" />
              <div className="w-2 h-2 bg-white/70 rounded-full" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/50" />
            </div>

            {/* Subtitle */}
            <div className={`mt-8 transition-all duration-1000 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
              <h2 className="text-white text-xl md:text-2xl font-semibold mb-6 tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                AN ACADEMIC ARCHIVE
              </h2>
              <p className="text-white/90 text-base md:text-lg font-normal leading-relaxed max-w-2xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] bg-gradient-to-br from-black/30 to-black/20 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl">
                Discover a comprehensive digital repository of academic excellence.
                From groundbreaking research to innovative theses, our archive preserves
                and shares knowledge that shapes the future. Join thousands of scholars
                in building the ultimate academic resource.
              </p>
            </div>

            {/* Feature highlights */}
            <div className={`mt-10 flex flex-wrap justify-center gap-6 transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free Access</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Verified Research</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>24/7 Availability</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className={`mt-12 transition-all duration-1000 delay-500 flex justify-center ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}>
              <button
                onClick={handleNavigate}
                className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-white to-gray-50 text-gray-900 rounded-xl hover:from-white hover:to-white hover:scale-105 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_12px_32px_rgba(255,255,255,0.4)] border-2 border-white/50 overflow-hidden"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                <span className="relative font-bold tracking-wide text-base uppercase flex items-center gap-3">
                  <span>Go to Submission Form</span>
                  <svg
                    className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Scroll indicator */}

          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </motion.div>
  );
};

export default SplashScreen;
