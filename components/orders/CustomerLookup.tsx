"use client";

import { useState, useEffect } from 'react';
import { User, Phone, Calendar, Star, TrendingUp } from 'lucide-react';
import type { Customer, Order } from '@/types/restaurant';
import { api } from '@/lib/api-client';

interface CustomerLookupProps {
  restaurantId: string;
  searchQuery: string; // phone or name
  onSelectCustomer: (customer: Customer, recentOrders: Order[]) => void;
}

export function CustomerLookup({
  restaurantId,
  searchQuery,
  onSelectCustomer,
}: CustomerLookupProps) {
  const [matchingCustomers, setMatchingCustomers] = useState<Customer[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Record<string, Order[]>>({});

  useEffect(() => {
    if (searchQuery.length < 3) {
      setMatchingCustomers([]);
      return;
    }

    const searchCustomers = async () => {
      try {
        const data = await api.get<{ customers: Customer[] }>(
          `/api/customers?restaurantId=${restaurantId}&search=${encodeURIComponent(searchQuery)}&limit=5`
        );
        const matches = data.customers || [];
        setMatchingCustomers(matches);

        // Get recent orders for matching customers
        const ordersMap: Record<string, Order[]> = {};
        if (matches.length > 0) {
          const ordersData = await api.get<{ orders: Order[] }>(
            `/api/orders?restaurantId=${restaurantId}&limit=50`
          );
          const allOrders = ordersData.orders || [];

          matches.forEach(customer => {
            const orders = allOrders
              .filter(o =>
                o.customerMobile === customer.mobile ||
                (o.customerName && o.customerName.toLowerCase() === customer.name.toLowerCase())
              )
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3);
            ordersMap[customer.id] = orders;
          });
        }
        setCustomerOrders(ordersMap);
      } catch {
        setMatchingCustomers([]);
      }
    };

    void searchCustomers();
  }, [restaurantId, searchQuery]);

  if (matchingCustomers.length === 0) return null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'text-primary bg-primary/10';
      case 'gold': return 'text-warning bg-warning/10';
      case 'silver': return 'text-muted-foreground bg-muted';
      default: return 'text-warning bg-warning/10';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
      <div className="p-2 text-xs text-muted-foreground border-b">
        Found {matchingCustomers.length} matching customer(s)
      </div>
      {matchingCustomers.map(customer => {
        const orders = customerOrders[customer.id] || [];
        return (
          <button
            key={customer.id}
            onClick={() => onSelectCustomer(customer, orders)}
            className="w-full p-3 hover:bg-muted border-b border-border last:border-0 text-left transition-colors"
          >
            {/* Customer Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{customer.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {customer.mobile}
                  </div>
                </div>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getTierColor(customer.tier)}`}>
                <Star className="h-3 w-3 inline mr-1" />
                {customer.tier}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {customer.visits} visits
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                ₹{customer.totalSpent.toLocaleString()} spent
              </span>
              {customer.lastVisit && (
                <span>Last: {formatDate(customer.lastVisit)}</span>
              )}
            </div>

            {/* Recent Orders */}
            {orders.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-1">Recent orders:</div>
                <div className="space-y-1">
                  {orders.map(order => (
                    <div key={order.id} className="text-xs flex justify-between text-muted-foreground">
                      <span>
                        {order.items.slice(0, 2).map(i => i.name).join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </span>
                      <span className="text-foreground font-medium">₹{order.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preferences */}
            {customer.preferences && customer.preferences.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {customer.preferences.map((pref, i) => (
                  <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs">
                    {pref}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

