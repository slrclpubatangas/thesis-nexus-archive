import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check, X, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Extract token from URL on component mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');

        if (!tokenParam) {
            setError('Invalid reset link. Please request a new password reset.');
        } else {
            setToken(tokenParam);
        }
    }, []);

    // Password validation states
    const [validations, setValidations] = useState({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
    });

    // Validate password requirements
    useEffect(() => {
        setValidations({
            minLength: password.length >= 8,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
        });
    }, [password]);

    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const allValidationsPassed = Object.values(validations).every(Boolean);
    const canSubmit = allValidationsPassed && passwordsMatch && !loading && token;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canSubmit || !token) return;

        setLoading(true);
        setError('');

        try {
            const { resetPassword } = await import('../lib/password-reset');
            const result = await resetPassword(token, password);

            if (!result.success) {
                throw new Error(result.error || 'Failed to reset password');
            }

            setSuccess(true);
            toast({
                title: 'Password updated',
                description: 'Your password has been successfully reset.',
            });

            // Redirect to home page after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
            toast({
                title: 'Error',
                description: err.message || 'Failed to reset password. The link may have expired.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Reset!</h2>
                    <p className="text-gray-600 mb-4">Your password has been successfully updated.</p>
                    <p className="text-sm text-gray-500">Redirecting to home page...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative overflow-hidden"
            >
                {/* Animated Background Orbs */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 blur-xl animate-pulse delay-1000"></div>

                {/* Header */}
                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-8 w-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Reset Password
                    </h1>
                    <p className="text-gray-600 text-sm">Enter your new password below</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 relative z-10">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                placeholder="Enter new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-all"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                placeholder="Confirm new password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-all"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Password must contain:</p>
                        {[
                            { key: 'minLength', label: 'At least 8 characters' },
                            { key: 'hasUppercase', label: 'One uppercase letter' },
                            { key: 'hasLowercase', label: 'One lowercase letter' },
                            { key: 'hasNumber', label: 'One number' },
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-center space-x-2">
                                {validations[key as keyof typeof validations] ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <X className="h-4 w-4 text-gray-400" />
                                )}
                                <span
                                    className={`text-xs ${validations[key as keyof typeof validations]
                                        ? 'text-green-700 font-medium'
                                        : 'text-gray-600'
                                        }`}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                        {confirmPassword && (
                            <div className="flex items-center space-x-2">
                                {passwordsMatch ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <X className="h-4 w-4 text-red-500" />
                                )}
                                <span
                                    className={`text-xs ${passwordsMatch ? 'text-green-700 font-medium' : 'text-red-600'
                                        }`}
                                >
                                    Passwords match
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${canSubmit
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 hover:shadow-lg active:scale-95'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Updating...</span>
                            </div>
                        ) : (
                            'Reset Password'
                        )}
                    </button>

                    {/* Back to Login */}
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Back to Home
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
