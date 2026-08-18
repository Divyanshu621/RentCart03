'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Home, FileCheck, ArrowRight, Sparkles, X } from 'lucide-react';

import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const [showPassword, setShowPassword] = useState(false);
  const [states, setStates] = useState<State[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);

  // Fetch states on mount
  useEffect(() => {
    api.getStates()
      .then((data) => {
        const parsed = data as unknown as State[];
        setStates(parsed.filter((s) => s.isActive));
      })
      .catch(() => {
        toast.error('Failed to load states');
      })
      .finally(() => setLoadingStates(false));
  }, []);

  const handleClose = useCallback(() => {
    setAuthModalOpen(false);
  }, [setAuthModalOpen]);

  const toggleView = useCallback(() => {
    setAuthModalView(authModalView === 'login' ? 'register' : 'login');
  }, [authModalView, setAuthModalView]);

  const handleAuthSuccess = useCallback(async (userData: Record<string, unknown>) => {
    try {
      const meData = await api.me();
      setUser(meData as unknown as UserType);
    } catch {
      setUser(userData as unknown as UserType);
    }
    toast.success(authModalView === 'login' ? 'Welcome back!' : 'Account created successfully!');
    setAuthModalOpen(false);
    setReturnUrl(null);
    navigate(returnUrl ? (returnUrl as 'marketplace' | 'dashboard') : 'marketplace');
  }, [authModalView, returnUrl, navigate, setAuthModalOpen, setReturnUrl, setUser]);

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0" showCloseButton={false}>
        {/* Header bar */}
        <div className="bg-[#0f172a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">RentLoop</span>
          </div>
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setAuthModalView('login')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                authModalView === 'login'
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthModalView('register')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                authModalView === 'register'
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <div className="p-6">
          {authModalView === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onToggleView={toggleView}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onToggleView={toggleView}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
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
  showPassword,
  onTogglePassword,
}: {
  onSuccess: (data: Record<string, unknown>) => void;
  onToggleView: () => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [serverError, setServerError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showGoogleDialog, setShowGoogleDialog] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const handleGoogleLogin = async () => {
    if (!googleEmail.trim() || !googleEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setIsGoogleLoading(true);
    try {
      const name = googleName.trim() || googleEmail.split('@')[0];
      const result = await api.googleAuth({ email: googleEmail.trim(), name });
      setShowGoogleDialog(false);
      onSuccess(result.user);
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
      onSuccess(res.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setServerError(message);
      toast.error(message);
    }
  };

  return (
    <div>
      <DialogHeader className="mb-6 text-left">
        <DialogTitle className="text-xl font-bold text-[#0f172a]">
        </DialogTitle>
        <DialogDescription className="text-muted-foreground">
        </DialogDescription>
      </DialogHeader>

      <h2 className="text-xl font-bold text-[#0f172a] mb-1">Welcome back</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Sign in to your RentLoop account
      </p>

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {/* Google sign-in divider + button */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-muted-foreground uppercase tracking-wider">
            or
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => { setGoogleEmail(''); setGoogleName(''); setShowGoogleDialog(true); }}
        className="w-full h-11 border-slate-200 hover:bg-slate-50 font-medium text-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>

      {/* Google email dialog */}
      {showGoogleDialog && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" onClick={() => !isGoogleLoading && setShowGoogleDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
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
              <button onClick={() => setShowGoogleDialog(false)} disabled={isGoogleLoading} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#0f172a]">Gmail Address</Label>
                <Input type="email" placeholder="you@gmail.com" value={googleEmail} onChange={(e) => setGoogleEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGoogleLogin()} disabled={isGoogleLoading} className="h-11" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#0f172a]">Display Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input type="text" placeholder="Your name" value={googleName} onChange={(e) => setGoogleName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGoogleLogin()} disabled={isGoogleLoading} className="h-11" />
              </div>
              <Button onClick={handleGoogleLogin} disabled={isGoogleLoading || !googleEmail.trim()} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                {isGoogleLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>) : (<>Continue <ArrowRight className="w-4 h-4" /></>)}
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email" className="text-sm font-medium text-[#0f172a]">
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="login-email"
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password" className="text-sm font-medium text-[#0f172a]">
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
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className="pl-10 pr-10 h-11"
              {...register('password')}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#0f172a] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-[#0f172a] hover:bg-[#0f172a]/90 text-white font-medium"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Login
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <button
          onClick={onToggleView}
          className="text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
}

// ─── Register Form ──────────────────────────────────────────
function RegisterForm({
  onSuccess,
  onToggleView,
  showPassword,
  onTogglePassword,
  states,
  loadingStates,
}: {
  onSuccess: (data: Record<string, unknown>) => void;
  onToggleView: () => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  states: State[];
  loadingStates: boolean;
}) {
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
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

  const selectedStateId = watch('stateId');
  const selectedState = states.find((s) => s.id === selectedStateId);
  const cities = selectedState?.cities?.filter((c) => c.isActive) || [];

  // Reset city when state changes
  useEffect(() => {
    setValue('cityId', '');
  }, [selectedStateId, setValue]);

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
    <div>
      <h2 className="text-xl font-bold text-[#0f172a] mb-1">Create your account</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Join RentLoop and start renting today
      </p>

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-name" className="text-sm font-medium text-[#0f172a]">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="reg-name"
              placeholder="John Doe"
              className="pl-10 h-10"
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-email" className="text-sm font-medium text-[#0f172a]">
            Email <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              className="pl-10 h-10"
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-phone" className="text-sm font-medium text-[#0f172a]">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="reg-phone"
              type="tel"
              placeholder="+91 98765 43210"
              className="pl-10 h-10"
              {...register('phone')}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-password" className="text-sm font-medium text-[#0f172a]">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              className="pl-10 pr-10 h-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#0f172a] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* State & City row */}
        <div className="grid grid-cols-2 gap-3">
          {/* State */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#0f172a]">
              State <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="stateId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loadingStates}
                >
                  <SelectTrigger className="w-full h-10">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder={loadingStates ? 'Loading...' : 'Select state'} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.stateId && (
              <p className="text-xs text-red-500">{errors.stateId.message}</p>
            )}
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-[#0f172a]">
              City <span className="text-red-500">*</span>
            </Label>
            <Controller
              name="cityId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedStateId}
                >
                  <SelectTrigger className="w-full h-10">
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder={cities.length === 0 ? 'Select state first' : 'Select city'} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cityId && (
              <p className="text-xs text-red-500">{errors.cityId.message}</p>
            )}
          </div>
        </div>

        {/* PIN Code & Address row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-pin" className="text-sm font-medium text-[#0f172a]">
              PIN Code
            </Label>
            <Input
              id="reg-pin"
              placeholder="400001"
              className="h-10"
              {...register('pinCode')}
            />
            {errors.pinCode && (
              <p className="text-xs text-red-500">{errors.pinCode.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-address" className="text-sm font-medium text-[#0f172a]">
              Address
            </Label>
            <Textarea
              id="reg-address"
              placeholder="Your address"
              className="h-10 resize-none"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-xs text-red-500">{errors.address.message}</p>
            )}
          </div>
        </div>

        {/* Terms checkbox */}
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
            htmlFor="agree-terms"
            className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
            onClick={(e) => {
              const cb = e.currentTarget.previousElementSibling as HTMLButtonElement;
              cb?.click();
            }}
          >
            I agree to the{' '}
            <span className="text-emerald-600 font-medium hover:underline cursor-pointer">Terms of Service</span>
            {', '}
            <span className="text-emerald-600 font-medium hover:underline cursor-pointer">Privacy Policy</span>
            {' '}and{' '}
            <span className="text-emerald-600 font-medium hover:underline cursor-pointer">Rental Agreement</span>
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-xs text-red-500">{errors.agreeTerms.message}</p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          onClick={onToggleView}
          className="text-emerald-600 hover:text-emerald-700 font-semibold"
        >
          Login
        </button>
      </p>
    </div>
  );
}
