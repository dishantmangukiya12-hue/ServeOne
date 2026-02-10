"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createRestaurant, getRestaurantData, registerRestaurantRemote, type Restaurant } from '@/services/dataService';
import { ArrowRight, Lock, Smartphone, Store, MapPin, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

export default function Register() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !mobile || !passcode || !confirmPasscode) {
      setError('Please fill in all required fields');
      return;
    }

    if (passcode !== confirmPasscode) {
      setError('Passcodes do not match');
      return;
    }

    if (passcode.length < 4) {
      setError('Passcode must be at least 4 characters');
      return;
    }

    setLoading(true);

    const restaurant: Restaurant = {
      id: `rest_${Date.now()}`,
      name,
      mobile,
      passcode,
      address,
      createdAt: new Date().toISOString(),
    };

    const restaurantData = createRestaurant(restaurant);
    const data = getRestaurantData(restaurant.id);
    if (data) {
      await registerRestaurantRemote(restaurant, data);
    }

    const result = await signIn('credentials', {
      mobile,
      passcode,
      redirect: false,
    });

    if (result?.ok) {
      const session = await getSession();
      login(restaurantData, {
        userId: session?.user?.userId,
        role: session?.user?.role,
      });
      router.push('/setup');
      router.refresh();
    }
    setLoading(false);
  };

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

      {/* Right side - Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-16 py-8">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-6">
          <Logo size="md" />
        </div>

        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Create Account</h2>
            <p className="text-muted-foreground text-sm md:text-base">Set up your restaurant in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {error && (
              <div className="p-3 md:p-4 bg-destructive/5 text-destructive rounded-xl text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Store className="h-5 w-5" />
              </div>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Restaurant Name *"
                className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Smartphone className="h-5 w-5" />
              </div>
              <Input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile Number *"
                className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Restaurant Address"
                className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Create Passcode * (min 4 chars)"
                className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
              />
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Check className="h-5 w-5" />
              </div>
              <Input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="Confirm Passcode *"
                className="w-full h-12 md:h-14 bg-card border border-border rounded-xl pl-12 pr-4"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 md:h-14 font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Already have an account? <span className="font-medium text-primary">Sign In</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
