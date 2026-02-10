"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Users, Utensils, Package, Truck, Bike, History, UserCheck } from 'lucide-react';
import type { Table, OrderChannel, Customer, Order, User as StaffUser } from '@/services/dataService';
import { CustomerLookup } from '../CustomerLookup';

const channels: { id: OrderChannel; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dineIn', name: 'Dine In', icon: Utensils },
  { id: 'takeAway', name: 'Take Away', icon: Package },
  { id: 'homeDelivery', name: 'Home Delivery', icon: Truck },
  { id: 'swiggy', name: 'Swiggy', icon: Bike },
  { id: 'zomato', name: 'Zomato', icon: Bike },
  { id: 'other', name: 'Other', icon: Package },
];

interface CustomerDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTable: Table | null;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerMobile: string;
  setCustomerMobile: (mobile: string) => void;
  adults: number;
  setAdults: (count: number) => void;
  kids: number;
  setKids: (count: number) => void;
  orderChannel: OrderChannel;
  setOrderChannel: (channel: OrderChannel) => void;
  onCancel: () => void;
  onProceed: () => void;
  restaurantId?: string;
  staffList?: StaffUser[];
  selectedWaiter: string;
  setSelectedWaiter: (waiter: string) => void;
}

export function CustomerDetailsDialog({
  open,
  onOpenChange,
  selectedTable,
  customerName,
  setCustomerName,
  customerMobile,
  setCustomerMobile,
  adults,
  setAdults,
  kids,
  setKids,
  orderChannel,
  setOrderChannel,
  onCancel,
  onProceed,
  restaurantId,
  staffList = [],
  selectedWaiter,
  setSelectedWaiter,
}: CustomerDetailsDialogProps) {
  const [showLookup, setShowLookup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Update search query when mobile or name changes
    const query = customerMobile || customerName;
    setSearchQuery(query);
    setShowLookup(query.length >= 3);
  }, [customerMobile, customerName]);

  const handleSelectCustomer = (customer: Customer, _recentOrders: Order[]) => {
    setCustomerName(customer.name);
    setCustomerMobile(customer.mobile);
    setShowLookup(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Who is ordering?</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">Enter the customer details</div>

        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs text-muted-foreground">Mobile Number</label>
            <div className="flex gap-2">
              <Input
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="Enter mobile number"
                className="flex-1"
              />
              {customerMobile.length >= 3 && (
                <button
                  onClick={() => setShowLookup(!showLookup)}
                  className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary hover:bg-primary/20"
                  title="Search customer history"
                >
                  <History className="h-4 w-4" />
                </button>
              )}
            </div>
            {showLookup && restaurantId && (
              <CustomerLookup
                restaurantId={restaurantId}
                searchQuery={searchQuery}
                onSelectCustomer={handleSelectCustomer}
              />
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Capacity : {selectedTable?.capacity || 4}</label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                  className="w-16 h-8"
                />
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  value={kids}
                  onChange={(e) => setKids(parseInt(e.target.value) || 0)}
                  className="w-16 h-8"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Order Channel</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {channels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setOrderChannel(ch.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                      orderChannel === ch.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {staffList.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground">Assign Waiter</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {staffList
                  .filter(s => s.status === 'active' && (s.role === 'waiter' || s.role === 'admin' || s.role === 'manager'))
                  .map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedWaiter(staff.name)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                        selectedWaiter === staff.name
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-card border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span className="text-xs truncate w-full text-center">{staff.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              CANCEL
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onProceed}>
              PROCEED
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

