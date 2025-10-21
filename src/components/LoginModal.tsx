// LoginModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { checkUserStatus } from '../lib/auth-utils';
import { createVerificationCode, consumeCode } from '../lib/email-verification';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

enum Step {
  CREDENTIALS,
  VERIFY,
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  /* ------------- Common state ------------- */
  const [step, setStep] = useState<Step>(Step.CREDENTIALS);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { signIn: contextSignIn } = useAuth();
  const { toast } = useToast();

  /* ------------- Lifecycle ------------- */
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ------------- Credential step ------------- */
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      /* 1. Authenticate */
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      /* 2. Check status */
      const isActive = await checkUserStatus(data.user!.id);
      if (!isActive) {
        await supabase.auth.signOut();
        throw new Error('Account deactivated.');
      }

      /* 3. Generate & send 6-digit code */
const sixDigitCode = await createVerificationCode(data.user.id);

// NEW: call the deployed Edge Function
await fetch(
  'https://zummzziydfpvwuxxuyyu.supabase.co/functions/v1/send-verification-email',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: sixDigitCode }),
  }
);
      console.log('📧 6-digit code for', email, ':', sixDigitCode);
      toast({ title: 'Code sent', description: 'Check your inbox (and spam).' });

      /* 4. Sign out user temporarily - they must verify to continue */
      await supabase.auth.signOut();

      /* 5. Move to verification step */
      setStep(Step.VERIFY);
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ------------- Verification step ------------- */
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Re-authenticate first to get user context for verification
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const { valid, reason } = await consumeCode(authData.user.id, code);
      if (!valid) {
        // Sign out again if verification fails
        await supabase.auth.signOut();
        toast({ title: 'Invalid code', description: reason, variant: 'destructive' });
        return;
      }

      // Code is valid - verification complete, user can stay logged in
      toast({ title: 'Verified!', description: 'Login successful' });
      onClose();
      
      // Reset form state
      setStep(Step.CREDENTIALS);
      setEmail('');
      setPassword('');
      setCode('');
    } catch (err: any) {
      await supabase.auth.signOut(); // Ensure user is signed out on any error
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  /* ------------- Keyboard submit ------------- */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email && password) {
      handleCredentialsSubmit(e);
    }
  };

  /* ------------- Render ------------- */
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: {
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.4
              }
            }}
            exit={{ 
              scale: 0.9, 
              opacity: 0, 
              y: 10,
              transition: { duration: 0.2 }
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 relative overflow-hidden"
          >
        {/* Animated Background & Orbs */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-50"></div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
        <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-xl animate-pulse delay-1000"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 relative z-10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            {step === Step.CREDENTIALS ? 'Login' : 'Enter 6-digit code'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all duration-200 hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>

        {/* Forms */}
        <div className="p-6 space-y-6 relative z-10">
          {step === Step.CREDENTIALS && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium transition-colors duration-200 ${
                    emailFocused ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${
                      emailFocused ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                      emailFocused
                        ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
                    placeholder="Enter your email"
                    required
                  />
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
                      emailFocused ? 'w-full' : 'w-0'
                    }`}
                  ></div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  className={`block text-sm font-medium transition-colors duration-200 ${
                    passwordFocused ? 'text-blue-600' : 'text-gray-700'
                  }`}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3 top-3 h-5 w-5 transition-colors duration-200 ${
                      passwordFocused ? 'text-blue-500' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                      passwordFocused
                        ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100'
                        : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                    }`}
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
                  <div
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
                      passwordFocused ? 'w-full' : 'w-0'
                    }`}
                  ></div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                  loading || !email || !password
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-lg hover:shadow-blue-200 active:scale-95'
                }`}
              >
                {loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse"></div>
                )}
                <div className="relative z-10 flex items-center justify-center space-x-2">
                  {loading && <Loader2 className="animate-spin" size={20} />}
                  <span>{loading ? 'Signing in…' : 'Continue'}</span>
                </div>
              </button>
            </form>
          )}

          {step === Step.VERIFY && (
            <form onSubmit={handleCodeSubmit} className="space-y-6">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="000000"
                required
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                {loading ? 'Verifying…' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(Step.CREDENTIALS);
                  setCode('');
                }}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            </form>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;