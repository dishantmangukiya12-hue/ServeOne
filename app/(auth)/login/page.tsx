"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { generateResetOTP, verifyOTPAndReset, getRestaurantData, hydrateRestaurantData } from '@/services/dataService';
import { ArrowRight, Lock, Smartphone, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  // Forgot password states
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [forgotMobile, setForgotMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmNewPasscode, setConfirmNewPasscode] = useState('');
  const [forgotStep, setForgotStep] = useState<'mobile' | 'otp' | 'reset'>('mobile');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!mobileNumber || !passcode) {
      setError('Please enter both mobile number and passcode');
      setLoading(false);
      return;
    }

    const result = await signIn('credentials', {
      mobile: mobileNumber,
      passcode,
      redirect: false,
    });

    if (result?.ok) {
      const session = await getSession();
      const sessionUser = session?.user;
      const restaurantId = sessionUser?.restaurantId;
      if (restaurantId) {
        let data = getRestaurantData(restaurantId);
        if (!data) {
          data = await hydrateRestaurantData(restaurantId);
        }
        if (data) {
          login(data.restaurant, {
            userId: sessionUser?.userId,
            role: sessionUser?.role,
          });
        }
      }
      toast.success('Welcome back!');
      router.push('/home');
      router.refresh();
    } else {
      setError('Invalid mobile number or passcode');
      toast.error('Invalid credentials');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotMobile) {
      toast.error('Please enter your mobile number');
      return;
    }

    setForgotLoading(true);
    const generatedOTP = generateResetOTP(forgotMobile);

    if (generatedOTP) {
      toast.success('OTP sent to your mobile', {
        duration: 5000
      });
      setForgotStep('otp');
    } else {
      toast.error('Mobile number not found');
    }
    setForgotLoading(false);
  };

  const handleVerifyOTP = () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }
    setForgotStep('reset');
  };

  const handleResetPassword = () => {
    if (newPasscode.length < 4) {
      toast.error('Passcode must be at least 4 characters');
      return;
    }
    if (newPasscode !== confirmNewPasscode) {
      toast.error('Passcodes do not match');
      return;
    }

    if (verifyOTPAndReset(forgotMobile, otp, newPasscode)) {
      toast.success('Password reset successful!');
      setShowForgotDialog(false);
      setForgotStep('mobile');
      setForgotMobile('');
      setOtp('');
      setNewPasscode('');
      setConfirmNewPasscode('');
    } else {
      toast.error('Invalid or expired OTP');
    }
  };

  if (showForgotDialog) {
    return (
      <div className="min-h-screen w-full flex bg-background">
        <div className="hidden lg:flex w-1/2 flex-col justify-center items-center px-16 bg-gradient-to-br from-emerald-700 to-teal-900 text-white relative overflow-hidden">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl" />
          <div className="relative z-10 text-center">
            <div className="bg-white/20 p-6 rounded-3xl w-fit mx-auto mb-8 backdrop-blur-sm">
              <Logo size="lg" collapsed />
            </div>
            <h1 className="text-5xl font-semibold mb-4">DineFlow</h1>
            <p className="text-xl text-emerald-100 mb-8">Reset Your Password</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-16 py-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
                {forgotStep === 'mobile' && 'Forgot Passcode?'}
                {forgotStep === 'otp' && 'Enter OTP'}
                {forgotStep === 'reset' && 'Create New Passcode'}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                {forgotStep === 'mobile' && 'Enter your registered mobile number'}
                {forgotStep === 'otp' && 'We sent a 6-digit code to your mobile'}
                {forgotStep === 'reset' && 'Choose a new secure passcode'}
              </p>
            </div>

            <div className="space-y-4">
              {forgotStep === 'mobile' && (
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <Input
                    type="tel"
                    value={forgotMobile}
                    onChange={(e) => setForgotMobile(e.target.value)}
                    placeholder="Registered Mobile Number"
                    className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
                  />
                </div>
              )}

              {forgotStep === 'otp' && (
                <div className="space-y-4">
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full h-12 md:h-14 bg-card border border-border rounded-xl text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <button
                    onClick={() => {
                      setForgotStep('mobile');
                      handleForgotPassword();
                    }}
                    className="text-primary text-sm hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              )}

              {forgotStep === 'reset' && (
                <>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      type={showPasscode ? 'text' : 'password'}
                      value={newPasscode}
                      onChange={(e) => setNewPasscode(e.target.value)}
                      placeholder="New Passcode (min 4 chars)"
                      className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPasscode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      type="password"
                      value={confirmNewPasscode}
                      onChange={(e) => setConfirmNewPasscode(e.target.value)}
                      placeholder="Confirm New Passcode"
                      className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowForgotDialog(false);
                    setForgotStep('mobile');
                    setForgotMobile('');
                    setOtp('');
                  }}
                  className="flex-1 h-12 md:h-14"
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    forgotStep === 'mobile' ? handleForgotPassword :
                    forgotStep === 'otp' ? handleVerifyOTP :
                    handleResetPassword
                  }
                  disabled={forgotLoading}
                  className="flex-1 h-12 md:h-14"
                >
                  {forgotLoading ? 'Processing...' : (
                    <>
                      {forgotStep === 'mobile' && 'Send OTP'}
                      {forgotStep === 'otp' && 'Verify'}
                      {forgotStep === 'reset' && 'Reset Passcode'}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side - Branding - Hidden on mobile */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center px-16 bg-gradient-to-br from-emerald-700 to-teal-900 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="bg-white/20 p-6 rounded-3xl w-fit mx-auto mb-8 backdrop-blur-sm">
            <Logo size="lg" collapsed />
          </div>
          <h1 className="text-5xl font-semibold mb-4">DineFlow</h1>
          <p className="text-xl text-emerald-100 mb-8">Restaurant Management System</p>
          <div className="flex gap-8 justify-center text-emerald-100">
            <div className="text-center">
              <p className="text-3xl font-semibold">Fast</p>
              <p className="text-sm opacity-80">Order Processing</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-semibold">Smart</p>
              <p className="text-sm opacity-80">Analytics</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-semibold">Simple</p>
              <p className="text-sm opacity-80">Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-16 py-8">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <Logo size="md" />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground text-sm md:text-base">Sign in to manage your restaurant</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {error && (
              <div className="p-3 md:p-4 bg-destructive/5 text-destructive rounded-xl text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Smartphone className="h-5 w-5" />
              </div>
              <Input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Mobile Number"
                className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasscode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 md:h-14 font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : (
                <>
                  Sign In
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4">
              <button
                type="button"
                onClick={() => setShowForgotDialog(true)}
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Forgot Passcode?
              </button>
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-primary text-sm font-medium hover:text-primary/80 transition-colors"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
