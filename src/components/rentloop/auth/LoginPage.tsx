'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Shield,
  Zap,
  Clock,
  Star,
  Loader2,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User as UserType } from '@/types';

// ─── Zod Schema ─────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Animation variants ─────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

// ─── LoginPage Component ────────────────────────────────────
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
      .then((config) => {
        setGoogleConfigured(config.configured);
      })
      .catch(() => {
        // Default to demo mode
        setGoogleConfigured(false);
      })
      .finally(() => setCheckedConfig(true));
  }, []);

  // Handle Google auth error from URL params (real OAuth callback error)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      toast.error(authError);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check for successful Google auth cookie (set by callback route)
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
      // Delete the cookie
      document.cookie = 'google_auth_success=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    }
  }, [setUser, navigate]);

  const handleGoogleClick = async () => {
    if (googleConfigured) {
      // Real OAuth: redirect to backend which redirects to Google
      setIsGoogleLoading(true);
      window.location.href = '/api/auth/google';
    } else {
      // Demo mode: show the Google-style dialog
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
    // Validate it looks like a Gmail address
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
    <div className="min-h-screen flex flex-col">
      {/* Mobile back link */}
      <div className="lg:hidden p-4">
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0f172a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] relative bg-[#0f172a] flex-col justify-between p-10 xl:p-14">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute top-1/2 -left-16 w-56 h-56 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-12 right-20 w-40 h-40 bg-emerald-400/8 rounded-full blur-2xl" />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          {/* Top - Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <button
              onClick={() => navigate('landing')}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-2xl tracking-tight">RentLoop</span>
            </button>
          </motion.div>

          {/* Center - Tagline and features */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="relative z-10 space-y-8"
          >
            <div>
              <motion.h1
                variants={fadeInUp}
                custom={0}
                className="text-3xl xl:text-4xl font-bold text-white leading-tight"
              >
                Rent anything,{' '}
                <span className="text-emerald-400">anywhere</span>
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                custom={1}
                className="mt-4 text-slate-300 text-base xl:text-lg leading-relaxed max-w-md"
              >
                Join thousands of people saving money and reducing waste by renting instead of buying.
              </motion.p>
            </div>

            {/* Feature cards */}
            <motion.div variants={staggerContainer} className="space-y-3">
              {[
                { icon: Shield, title: 'Verified Owners', desc: 'All listings vetted for quality' },
                { icon: Zap, title: 'Instant Booking', desc: 'Book in seconds, receive fast' },
                { icon: Clock, title: 'Flexible Rentals', desc: 'Rent by day, week, or month' },
                { icon: Star, title: 'Top Rated', desc: '4.9 average across 25K+ rentals' },
              ].map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  custom={2}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{feature.title}</p>
                    <p className="text-slate-400 text-xs">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Bottom - Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="relative z-10"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-slate-300 text-sm italic leading-relaxed">
                &ldquo;RentLoop saved me ₹50,000 last year. I rented a camera for my wedding instead of buying one. Brilliant platform!&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  PR
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Priya R.</p>
                  <p className="text-slate-400 text-xs">Mumbai · 12 rentals</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-[#0f172a] font-bold text-xl">RentLoop</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#0f172a]">Welcome back</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Sign in to access your account
              </p>
            </div>

            {/* Error display */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
              >
                {serverError}
              </motion.div>
            )}

            {/* Google sign-in button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleClick}
              disabled={isGoogleLoading || !checkedConfig}
              className="w-full h-11 border-slate-200 hover:bg-slate-50 font-medium text-sm"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-muted-foreground uppercase tracking-wider">
                  or continue with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="page-login-email" className="text-sm font-medium text-[#0f172a]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="page-login-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10 h-11"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="page-login-password" className="text-sm font-medium text-[#0f172a]">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => toast.info('Password reset link sent to your email!')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="page-login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#0f172a] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <LoaderIcon />
                    </motion.span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <button
                onClick={openRegister}
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                Create one
              </button>
            </p>

            {/* Desktop back link */}
            <div className="hidden lg:block mt-8 text-center">
              <button
                onClick={() => navigate('landing')}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0f172a] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to home
              </button>
            </div>
          </motion.div>
        </div>
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-[#0f172a]">Sign in with Google</h3>
                    <p className="text-xs text-muted-foreground">Enter your Gmail to continue</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoogleDialog(false)}
                  disabled={isGoogleLoading}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f172a]">Gmail Address</Label>
                  <Input
                    type="email"
                    placeholder="you@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="h-11"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Only Gmail addresses are supported for demo mode
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#0f172a]">Display Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()}
                    disabled={isGoogleLoading}
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={handleDemoGoogleLogin}
                  disabled={isGoogleLoading || !googleEmail.trim()}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
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

// ─── Inline loader icon (to avoid importing Loader2 with motion wrapper issues) ──
function LoaderIcon() {
  return <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
  </svg>;
}
