  import React, { useState, useEffect } from 'react';
  import { X, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
  import { useAuth } from '../hooks/useAuth';
  import { useToast } from '../hooks/use-toast';

  interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
  }

  const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const { toast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setMounted(true);
      } else {
        const timer = setTimeout(() => setMounted(false), 300);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        console.log('Login form submitted for:', email);
        await signIn(email, password);
        toast({
          title: "Success",
          description: "Successfully logged in!",
        });
        onClose();
        // Reset form
        setEmail('');
        setPassword('');
      } catch (error: any) {
        console.error('Login error:', error);

        let errorMessage = "Invalid credentials. Please try again.";

        // Handle specific Supabase auth errors
        if (error?.message) {
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = "Invalid email or password. Please check your credentials.";
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = "Please check your email and confirm your account before signing in.";
          } else if (error.message.includes('User not found')) {
            errorMessage = "No account found with this email address.";
          } else {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && email && password) {
        handleSubmit(e);
      }
    };

    if (!mounted) return null;

    return (
      <div className={`fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden transform transition-all duration-500 ease-out ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50"></div>

          {/* Floating Orbs */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-xl animate-pulse delay-1000"></div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 relative z-10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Admin Login
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 hover:rotate-90">
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">
            {/* Email Field */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium transition-colors duration-200 ${emailFocused ? 'text-blue-600' : 'text-gray-700'}`}>
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${emailFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onKeyPress={handleKeyPress}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${emailFocused ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}
                  placeholder="Enter your email"
                  required
                />
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${emailFocused ? 'w-full' : 'w-0'}`}></div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium transition-colors duration-200 ${passwordFocused ? 'text-blue-600' : 'text-gray-700'}`}>
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${passwordFocused ? 'text-blue-500' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyPress={handleKeyPress}
                  className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${passwordFocused ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${passwordFocused ? 'w-full' : 'w-0'}`}></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${loading || !email || !password ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-200 active:scale-95'}`}
            >
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
              )}
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </div>
            </button>
          </form>
        </div>
      </div>
    );
  };

  export default LoginModal;
