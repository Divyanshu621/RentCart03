'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff, X, Phone, MapPin, Home } from 'lucide-react';

import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { User as UserType, State } from '@/types';

// ─── Zod Schemas ────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  stateId: z.string().min(1, 'Please select a state'),
  cityId: z.string().min(1, 'Please select a city'),
  pinCode: z.string().optional(),
  address: z.string().optional(),
  agreeTerms: z.literal(true, { errorMap: () => ({ message: 'You must agree to the terms' }) }),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Shared Google SVG ──────────────────────────────────────
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

// ─── Pinterest-style Input class ────────────────────────────
const inputClass =
  'h-11 rounded-2xl border-gray-300 text-[15px] placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 px-4';
const inputErrorClass =
  'h-11 rounded-2xl border-red-400 text-[15px] placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:border-red-400 px-4';

// ─── AuthModal Component ────────────────────────────────────
export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalView,
    setAuthModalView,
    setUser,
    navigate,
    returnUrl,
    setReturnUrl,
  } = useAppStore();

  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);

  useEffect(() => {
    api.getStates()
      .then((data) => {
        const parsed = data as unknown as State[];
        setStates(parsed.filter((s) => s.isActive));
      })
      .catch(() => toast.error('Failed to load states'))
      .finally(() => setLoadingStates(false));
  }, []);

  const handleClose = useCallback(() => setAuthModalOpen(false), [setAuthModalOpen]);

  const toggleView = useCallback(() => {
    setAuthModalView(authModalView === 'login' ? 'register' : 'login');
  }, [authModalView, setAuthModalView]);

  const handleAuthSuccess = useCallback(async (userData: Record<string, unknown>) => {
    try {
      const meData = await api.me();
      setUser(meData as unknown as UserType);
      const u = meData as unknown as UserType;
      toast.success(authModalView === 'login' ? 'Welcome back!' : 'Account created successfully!');
      setAuthModalOpen(false);
      setReturnUrl(null);
      if (u.role === 'OWNER' && u.kycStatus !== 'VERIFIED') {
        navigate('seller-kyc');
      } else {
        navigate(returnUrl ? (returnUrl as 'marketplace' | 'dashboard') : 'marketplace');
      }
    } catch {
      setUser(userData as unknown as UserType);
    }
  }, [authModalView, returnUrl, navigate, setAuthModalOpen, setReturnUrl, setUser]);

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[440px] max-h-[92vh] p-0 overflow-hidden gap-0 rounded-3xl border-gray-200 flex flex-col">
        <div className="p-6 sm:p-7 overflow-y-auto flex-1">
          {authModalView === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onToggleView={toggleView}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onToggleView={toggleView}
              states={states}
              loadingStates={loadingStates}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Login Form ─────────────────────────────────────────────
function LoginForm({
  onSuccess,
  onToggleView,
}: {
  onSuccess: (data: Record<string, unknown>) => void;
  onToggleView: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [checkedConfig, setCheckedConfig] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    api.getGoogleConfig()
      .then((c) => setGoogleConfigured(c.configured))
      .catch(() => setGoogleConfigured(false))
      .finally(() => setCheckedConfig(true));
  }, []);

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
      setShowGoogleDialog(false);
      onSuccess(result.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      const res = await api.login({ email: data.email, password: data.password });
      onSuccess(res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <div>
        {/* Heading */}
        <h2 className="text-[24px] font-semibold text-[#0f172a] leading-tight mb-5">
          Log in to discover more<br />rental deals just for you
        </h2>

        {serverError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              className={errors.email ? inputErrorClass : inputClass}
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
                className={`pr-12 ${errors.password ? inputErrorClass : inputClass}`}
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

          {/* Forgot password - left aligned */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => toast.info('Password reset link sent to your email!')}
              className="text-[15px] text-[#0074e8] hover:text-[#0060b8] font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Log in - Red pill button */}
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
        <p className="mt-5 text-center text-sm text-[#0f172a]">
          Not on RentCart yet?{' '}
          <button
            onClick={onToggleView}
            className="text-[#0074e8] hover:text-[#0060b8] font-semibold transition-colors"
          >
            Sign up
          </button>
        </p>

        {/* Terms */}
        <p className="mt-3 text-center text-xs text-gray-500 leading-relaxed">
          By continuing, you agree to RentCart&apos;s{' '}
          <span className="underline cursor-pointer">Terms of Service</span>
          {' '}and acknowledge our{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>

      {/* Google Dialog (Demo) */}
      {showGoogleDialog && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => !isGoogleLoading && setShowGoogleDialog(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <GoogleIcon className="w-7 h-7" />
                <div>
                  <h3 className="font-bold text-[#0f172a] text-[17px]">Sign in with Google</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Enter your Gmail to continue</p>
                </div>
              </div>
              <button onClick={() => setShowGoogleDialog(false)} disabled={isGoogleLoading} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0f172a] mb-1.5 block">Gmail Address</label>
                <Input type="email" placeholder="you@gmail.com" value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()} disabled={isGoogleLoading} className={inputClass} autoFocus />
                <p className="text-xs text-gray-500 mt-1.5">Only Gmail addresses are supported for demo mode</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[#0f172a] mb-1.5 block">
                  Display Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input type="text" placeholder="Your name" value={googleName} onChange={(e) => setGoogleName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleDemoGoogleLogin()} disabled={isGoogleLoading} className={inputClass} />
              </div>
              <Button onClick={handleDemoGoogleLogin} disabled={isGoogleLoading || !googleEmail.trim()} className="w-full h-[48px] rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[15px] transition-colors shadow-none">
                {isGoogleLoading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Signing in...</>) : 'Continue'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Register Form ──────────────────────────────────────────
function RegisterForm({
  onSuccess,
  onToggleView,
  states,
  loadingStates,
}: {
  onSuccess: (data: Record<string, unknown>) => void;
  onToggleView: () => void;
  states: State[];
  loadingStates: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      stateId: '',
      cityId: '',
      pinCode: '',
      address: '',
      agreeTerms: false as unknown as true,
    },
  });

  const selectedStateId = useWatch({ control, name: 'stateId' });
  const selectedState = states.find((s) => s.id === selectedStateId);
  const cities = selectedState?.cities?.filter((c) => c.isActive) || [];

  useEffect(() => { setValue('cityId', ''); }, [selectedStateId, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError('');
    try {
      const res = await api.register({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
        stateId: data.stateId,
        cityId: data.cityId,
        pinCode: data.pinCode || undefined,
        address: data.address || undefined,
      });
      onSuccess(res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <div>
        {/* Heading */}
        <h2 className="text-[24px] font-semibold text-[#0f172a] leading-tight mb-1">
          Welcome to RentCart
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Create an account to start renting and saving
        </p>

        {serverError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
          {/* Full Name */}
          <div>
            <Input
              placeholder="Full Name"
              className={errors.name ? inputErrorClass : inputClass}
              {...register('name')}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1 ml-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <Input
              type="email"
              placeholder="Email"
              className={errors.email ? inputErrorClass : inputClass}
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-red-600 mt-1 ml-1">{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input
                type="tel"
                placeholder="Phone Number (optional)"
                className={`pl-10 ${errors.phone ? inputErrorClass : inputClass}`}
                {...register('phone')}
              />
            </div>
            {errors.phone && <p className="text-sm text-red-600 mt-1 ml-1">{errors.phone.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password (min. 6 characters)"
                className={`pr-12 ${errors.password ? inputErrorClass : inputClass}`}
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
            {errors.password && <p className="text-sm text-red-600 mt-1 ml-1">{errors.password.message}</p>}
          </div>

          {/* State & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Controller
                name="stateId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loadingStates}>
                    <SelectTrigger className={`w-full h-11 rounded-2xl border-gray-300 ${errors.stateId ? 'border-red-400' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <SelectValue placeholder={loadingStates ? 'Loading...' : 'State'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stateId && <p className="text-xs text-red-600 mt-1 ml-1">{errors.stateId.message}</p>}
            </div>
            <div>
              <Controller
                name="cityId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!selectedStateId}>
                    <SelectTrigger className={`w-full h-11 rounded-2xl border-gray-300 ${errors.cityId ? 'border-red-400' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <SelectValue placeholder={cities.length === 0 ? 'State first' : 'City'} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.cityId && <p className="text-xs text-red-600 mt-1 ml-1">{errors.cityId.message}</p>}
            </div>
          </div>

          {/* PIN & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                placeholder="PIN Code"
                className={errors.pinCode ? inputErrorClass : inputClass}
                {...register('pinCode')}
              />
              {errors.pinCode && <p className="text-xs text-red-600 mt-1 ml-1">{errors.pinCode.message}</p>}
            </div>
            <div>
              <Textarea
                placeholder="Address"
                className={`${errors.address ? inputErrorClass : inputClass} h-[52px] resize-none`}
                {...register('address')}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1 ml-1">{errors.address.message}</p>}
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2.5 pt-1">
            <Controller
              name="agreeTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                />
              )}
            />
            <label
              className="text-xs text-gray-500 leading-relaxed cursor-pointer"
              onClick={(e) => {
                const cb = e.currentTarget.previousElementSibling as HTMLButtonElement;
                cb?.click();
              }}
            >
              I agree to the{' '}
              <span className="text-[#0074e8] font-medium hover:underline cursor-pointer">Terms of Service</span>
              {', '}
              <span className="text-[#0074e8] font-medium hover:underline cursor-pointer">Privacy Policy</span>
              {' '}and{' '}
              <span className="text-[#0074e8] font-medium hover:underline cursor-pointer">Rental Agreement</span>
            </label>
          </div>
          {errors.agreeTerms && <p className="text-xs text-red-600 ml-1">{errors.agreeTerms.message}</p>}

          {/* Submit - Red pill */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-full bg-[#e60023] hover:bg-[#cc001f] active:bg-[#b3001b] text-white font-semibold text-[15px] transition-colors shadow-none mt-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        {/* Login link */}
        <p className="mt-4 text-center text-sm text-[#0f172a]">
          Already a member?{' '}
          <button
            onClick={onToggleView}
            className="text-[#0074e8] hover:text-[#0060b8] font-semibold transition-colors"
          >
            Log in
          </button>
        </p>

        {/* Terms */}
        <p className="mt-3 text-center text-xs text-gray-500 leading-relaxed">
          By continuing, you agree to RentCart&apos;s{' '}
          <span className="underline cursor-pointer">Terms of Service</span>
          {' '}and acknowledge our{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </>
  );
}
