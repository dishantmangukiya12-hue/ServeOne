"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers, useRestaurant, useUpdateRestaurant } from '@/hooks/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Gift, Users, Search, Award } from 'lucide-react';
import type { Customer } from '@/types/restaurant';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const tierConfig = {
  bronze: { name: 'Bronze', color: 'bg-amber-700', icon: '🥉', minSpend: 0 },
  silver: { name: 'Silver', color: 'bg-slate-400', icon: '🥈', minSpend: 5000 },
  gold: { name: 'Gold', color: 'bg-yellow-500', icon: '🥇', minSpend: 20000 },
  platinum: { name: 'Platinum', color: 'bg-purple-500', icon: '💎', minSpend: 50000 },
};

export default function Loyalty() {
  const { restaurant } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: customersData } = useCustomers(restaurant?.id);
  const { data: restaurantData } = useRestaurant(restaurant?.id);
  const updateRestaurant = useUpdateRestaurant(restaurant?.id);

  const customers = customersData?.customers || [];
  const settings = {
    enableLoyalty: restaurantData?.settings?.enableLoyalty ?? true,
    pointsPerRupee: restaurantData?.settings?.loyaltyPointsPerRupee ?? 1,
  };

  const handleToggleLoyalty = (enabled: boolean) => {
    updateRestaurant.mutate(
      { settings: { enableLoyalty: enabled } },
      { onSuccess: () => toast.success(enabled ? 'Loyalty program enabled' : 'Loyalty program disabled') }
    );
  };

  const handleUpdatePointsRate = (rate: number) => {
    updateRestaurant.mutate({ settings: { loyaltyPointsPerRupee: rate } });
  };

  const filteredCustomers = customers
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery)
    )
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const tierCounts = {
    bronze: customers.filter(c => c.tier === 'bronze').length,
    silver: customers.filter(c => c.tier === 'silver').length,
    gold: customers.filter(c => c.tier === 'gold').length,
    platinum: customers.filter(c => c.tier === 'platinum').length,
  };

  const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
  const totalCustomers = customers.length;

  if (!restaurant) {
    return null;
  }

  if (!settings.enableLoyalty) {
    return (
      <div className="min-h-screen bg-background">
        <main className="p-4 md:p-6 max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Loyalty Program</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Enable the loyalty program to reward your repeat customers with points that can be redeemed for discounts and special offers.
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-muted-foreground">Enable Loyalty Program</span>
              <Switch
                checked={settings.enableLoyalty}
                onCheckedChange={handleToggleLoyalty}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-warning p-3 rounded-xl">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Loyalty Program</h1>
              <p className="text-muted-foreground text-sm">Reward your loyal customers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Program</span>
              <Switch
                checked={settings.enableLoyalty}
                onCheckedChange={handleToggleLoyalty}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-muted-foreground text-xs">Total Members</div>
            <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
          </Card>
          <Card className="p-4">
            <div className="text-muted-foreground text-xs">Points Issued</div>
            <div className="text-2xl font-bold text-warning">{totalPoints.toLocaleString()}</div>
          </Card>
          <Card className="p-4">
            <div className="text-muted-foreground text-xs">Points Rate</div>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={settings.pointsPerRupee}
                onChange={(e) => handleUpdatePointsRate(parseInt(e.target.value))}
                className="border border-border rounded px-2 py-1 text-sm bg-background"
              >
                <option value={1}>1 pt/$1</option>
                <option value={2}>2 pt/$1</option>
                <option value={5}>5 pt/$1</option>
                <option value={10}>10 pt/$1</option>
              </select>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-muted-foreground text-xs">Avg. Spend</div>
            <div className="text-2xl font-bold text-foreground">
              ${totalCustomers > 0 ? Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers).toLocaleString() : 0}
            </div>
          </Card>
        </div>

        {/* Tier Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(tierConfig).map(([tier, config]) => (
            <Card key={tier} className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{config.icon}</span>
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
              </div>
              <div className="text-muted-foreground text-xs">{config.name}</div>
              <div className="text-2xl font-bold text-foreground">{tierCounts[tier as keyof typeof tierCounts]}</div>
              <div className="text-xs text-muted-foreground">${config.minSpend}+ spend</div>
            </Card>
          ))}
        </div>

        {/* How it Works */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" />
            How it Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl mb-2">🛍️</div>
              <div className="font-medium text-foreground">Customer Orders</div>
              <div className="text-xs text-muted-foreground mt-1">Every order counts towards loyalty points</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl mb-2">✨</div>
              <div className="font-medium text-foreground">Earn Points</div>
              <div className="text-xs text-muted-foreground mt-1">{settings.pointsPerRupee} point per $1 spent</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl mb-2">⬆️</div>
              <div className="font-medium text-foreground">Level Up</div>
              <div className="text-xs text-muted-foreground mt-1">Unlock new tiers with more spending</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-xl">
              <div className="text-3xl mb-2">🎁</div>
              <div className="font-medium text-foreground">Get Rewards</div>
              <div className="text-xs text-muted-foreground mt-1">Redeem points for discounts</div>
            </div>
          </div>
        </Card>

        {/* Tier Benefits */}
        <Card className="p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Tier Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🥉</span>
                <span className="font-bold text-amber-800">Bronze</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Join the program</li>
                <li>- Earn points on orders</li>
                <li>- Birthday surprise</li>
              </ul>
            </div>
            <div className="border border-border rounded-xl p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🥈</span>
                <span className="font-bold text-foreground">Silver</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- All Bronze benefits</li>
                <li>- 5% discount on orders</li>
                <li>- Priority reservations</li>
              </ul>
            </div>
            <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🥇</span>
                <span className="font-bold text-yellow-800">Gold</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- All Silver benefits</li>
                <li>- 10% discount on orders</li>
                <li>- Free dessert on visits</li>
              </ul>
            </div>
            <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💎</span>
                <span className="font-bold text-purple-800">Platinum</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- All Gold benefits</li>
                <li>- 15% discount on orders</li>
                <li>- Exclusive events access</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Customers List */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">Loyalty Members</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-64"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Tier</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Visits</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Spent</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Points</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const tier = tierConfig[customer.tier];
                    return (
                      <tr key={customer.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${tier.color}`}>
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">{customer.mobile}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span>{tier.icon}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${tier.color}`}>
                              {tier.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{customer.visits}</td>
                        <td className="p-4 font-medium">${customer.totalSpent.toLocaleString()}</td>
                        <td className="p-4">
                          <span className="text-warning font-bold">{customer.loyaltyPoints.toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground ml-1">pts</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No loyalty members yet</p>
                      <p className="text-sm">Customers will appear here when they place orders</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

