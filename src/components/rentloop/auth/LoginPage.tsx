'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User as UserType } from '@/types';

// ─── Zod Schema ─────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Google SVG Icon ────────────────────────────────────────
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

// ─── Pinterest-style Login Page ─────────────────────────────
export default function LoginPage() {
  const { setUser, navigate, setAuthModalOpen, setAuthModalView } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [checkedConfig, setCheckedConfig] = useState(false);

  // Check if real Google OAuth is configured
  useEffect(() => {
    api.getGoogleConfig()
      .then((config) => setGoogleConfigured(config.configured))
      .catch(() => setGoogleConfigured(false))
      .finally(() => setCheckedConfig(true));
  }, []);

  // Handle Google auth error from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      toast.error(authError);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const successCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('google_auth_success='));
    if (successCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(successCookie.split('=')[1]));
        setUser(userData as unknown as UserType);
        toast.success('Welcome back!');
        navigate('marketplace');
      } catch {
        // Fall through to api.me()
      }
      document.cookie = 'google_auth_success=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  }, [setUser, navigate]);

  const handleGoogleClick = async () => {
    if (googleConfigured) {
      setIsGoogleLoading(true);
      window.location.href = '/api/auth/google';
    } else {
      setGoogleEmail('');
      setGoogleName('');
      setShowGoogleDialog(true);
    }
  };

  const handleDemoGoogleLogin = async () => {
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    const emailLower = googleEmail.trim().toLowerCase();
    if (!emailLower.endsWith('@gmail.com') && !emailLower.endsWith('@googlemail.com')) {
      toast.error('Please enter a valid Gmail address (e.g., you@gmail.com)');
      return;
    }
    setIsGoogleLoading(true);
    try {
      const name = googleName.trim() || emailLower.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const result = await api.googleAuth({ email: emailLower, name });
      try {
        const meData = await api.me();
        setUser(meData as unknown as UserType);
      } catch {
        setUser(result.user as unknown as UserType);
      }
      toast.success('Welcome back!');
      setShowGoogleDialog(false);
      navigate('marketplace');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      toast.error(message);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      const res = await api.login({ email: data.email, password: data.password });
      try {
        const meData = await api.me();
        setUser(meData as unknown as UserType);
      } catch {
        setUser(res.user as unknown as UserType);
      }
      toast.success('Welcome back!');
      navigate('marketplace');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setServerError(message);
      toast.error(message);
    }
  };

  const openRegister = () => {
    setAuthModalView('register');
    setAuthModalOpen(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar with logo */}
      <div className="w-full max-w-md mx-auto px-6 pt-6 pb-2">
        <button
          onClick={() => navigate('landing')}
          className="inline-flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <span className="text-[#0f172a] font-bold text-xl tracking-tight group-hover:opacity-80 transition-opacity">RentCart</span>
        </button>
      </div>

      {/* Centered form card */}
      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <h1 className="text-[28px] font-semibold text-[#0f172a] leading-tight mb-6">
            Log in to discover more<br />rental deals just for you
          </h1>

          {/* Error display */}
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {serverError}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Email */}
            <div>
              <Input
                type="email"
                placeholder="Email"
                className={`h-[52px] rounded-2xl border-gray-300 text-[15px] placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 px-4 ${errors.email ? 'border-red-400 focus-visible:ring-red-400 focus-visible:border-red-400' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1 ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className={`h-[52px] rounded-2xl border-gray-300 text-[15px] placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 px-4 pr-12 ${errors.password ? 'border-red-400 focus-visible:ring-red-400 focus-visible:border-red-400' : ''}`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Forgot Password - left-aligned blue link */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => toast.info('Password reset link sent to your email!')}
                className="text-[15px] text-[#0074e8] hover:text-[#0060b8] font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Log in button - Red pill */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[52px] rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[16px] transition-colors shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </Button>
          </form>

          {/* OR divider */}
          <div className="relative my-5 flex items-center">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-4 text-sm font-medium text-[#0f172a]">OR</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isGoogleLoading || !checkedConfig}
            className="w-full h-[52px] rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-2.5 text-[15px] font-medium text-[#0f172a] transition-colors disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <GoogleIcon />
            )}
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-[#0f172a]">
            Not on RentCart yet?{' '}
            <button
              onClick={openRegister}
              className="text-[#0074e8] hover:text-[#0060b8] font-semibold transition-colors"
            >
              Sign up
            </button>
          </p>

          {/* Terms notice */}
          <p className="mt-4 text-center text-xs text-gray-500 leading-relaxed">
            By continuing, you agree to RentCart&apos;s{' '}
            <span className="underline cursor-pointer">Terms of Service</span>
            {' '}and acknowledge our{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>

      {/* Google Sign-in Dialog (Demo Mode) */}
      <AnimatePresence>
        {showGoogleDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
            onClick={() => !isGoogleLoading && setShowGoogleDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GoogleIcon className="w-7 h-7" />
                  <div>
                    <h3 className="font-bold text-[#0f172a] text-[17px]">Sign in with Google</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Enter your Gmail to continue</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoogleDialog(false)}
                  disabled={isGoogleLoading}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#0f172a] mb-1.5 block">Gmail Address</label>
                  <Input
                    type="email"
                    placeholder="you@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="h-[48px] rounded-xl border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-[15px]"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Only Gmail addresses are supported for demo mode</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#0f172a] mb-1.5 block">
                    Display Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="h-[48px] rounded-xl border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 text-[15px]"
                  />
                </div>
                <Button
                  onClick={handleDemoGoogleLogin}
                  disabled={isGoogleLoading || !googleEmail.trim()}
                  className="w-full h-[48px] rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[15px] transition-colors shadow-none"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
