"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Phone, Mail, ShoppingBag } from 'lucide-react';
import { getRestaurantData } from '@/services/dataService';

interface CustomerData {
  name: string;
  mobile: string;
  email: string;
  visits: number;
  totalSpent: number;
  lastVisit: string;
}

export default function Customers() {
  const { restaurant } = useAuth();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = useCallback(() => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (!data) return;

    // Extract unique customers from orders
    const customerMap: { [key: string]: CustomerData } = {};

    data.orders.forEach(order => {
      const key = order.customerMobile || order.customerName;
      if (!key || key.trim() === '') return; // skip anonymous guests
      if (!customerMap[key]) {
        customerMap[key] = {
          name: order.customerName,
          mobile: order.customerMobile,
          email: '',
          visits: 0,
          totalSpent: 0,
          lastVisit: order.createdAt
        };
      }

      customerMap[key].visits++;
      if (order.status === 'closed') {
        customerMap[key].totalSpent += order.total;
      }

      if (new Date(order.createdAt) > new Date(customerMap[key].lastVisit)) {
        customerMap[key].lastVisit = order.createdAt;
      }
    });

    setCustomers(Object.values(customerMap));
  }, [restaurant]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobile.includes(searchQuery)
  );

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Customers</h1>
        </div>

        <Card className="overflow-hidden">
          <div className="p-3 md:p-4 border-b">
            <div className="relative max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="hidden sm:table-cell p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Contact</th>
                  <th className="p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Visits</th>
                  <th className="p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Spent</th>
                  <th className="hidden md:table-cell p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted">
                      <td className="p-2 md:p-4">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary font-medium text-sm md:text-base">
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-sm">{customer.name}</span>
                            <div className="sm:hidden text-xs text-muted-foreground">
                              {customer.mobile && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {customer.mobile}
                                </div>
                              )}
                            </div>
                            <div className="md:hidden text-xs text-muted-foreground">
                              {new Date(customer.lastVisit).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-2 md:p-4">
                        <div className="flex flex-col gap-1">
                          {customer.mobile && (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {customer.mobile}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 md:p-4">
                        <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-primary/10 text-primary rounded-full text-[10px] md:text-xs flex items-center gap-1 w-fit">
                          <ShoppingBag className="h-3 w-3" />
                          {customer.visits}
                        </span>
                      </td>
                      <td className="p-2 md:p-4 font-medium text-sm">₹{customer.totalSpent.toLocaleString()}</td>
                      <td className="hidden md:table-cell p-2 md:p-4 text-xs md:text-sm text-muted-foreground">
                        {new Date(customer.lastVisit).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-8 md:p-16 text-center text-muted-foreground" colSpan={5}>
                      <div className="text-4xl md:text-6xl mb-4">👤</div>
                      <p className="text-base md:text-lg mb-2">No customers yet</p>
                    <p className="text-sm">Customer data will appear here when orders are placed</p>
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

