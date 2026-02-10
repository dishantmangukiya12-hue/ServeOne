"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CreditCard, Banknote, Smartphone, Wallet } from 'lucide-react';
import type { Order } from '@/services/dataService';

interface PaymentEntry {
  id: string;
  method: string;
  amount: number;
}

interface MultiPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (payments: PaymentEntry[]) => void;
}

const paymentMethods = [
  { id: 'Cash', label: 'Cash', icon: Banknote, color: 'emerald' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'purple' },
  { id: 'Card', label: 'Card', icon: CreditCard, color: 'blue' },
  { id: 'Wallet', label: 'Wallet', icon: Wallet, color: 'amber' },
];

export function MultiPaymentDialog({
  open,
  onClose,
  order,
  onConfirm,
}: MultiPaymentDialogProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [selectedMethod] = useState('Cash');

  useEffect(() => {
    if (open && order) {
      // Start with full amount as first payment
      setPayments([{
        id: `pay_${Date.now()}`,
        method: 'Cash',
        amount: order.total
      }]);
    }
  }, [open, order]);

  if (!order) return null;

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = order.total - totalPaid;

  const addPayment = () => {
    if (remaining <= 0) return;
    setPayments([...payments, {
      id: `pay_${Date.now()}`,
      method: selectedMethod,
      amount: remaining
    }]);
  };

  const updatePayment = (id: string, amount: number) => {
    setPayments(payments.map(p =>
      p.id === id ? { ...p, amount: Math.max(0, amount) } : p
    ));
  };

  const updatePaymentMethod = (id: string, method: string) => {
    setPayments(payments.map(p =>
      p.id === id ? { ...p, method } : p
    ));
  };

  const removePayment = (id: string) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter(p => p.id !== id));
  };

  const handleConfirm = () => {
    if (remaining !== 0) return;
    onConfirm(payments);
    onClose();
  };

  const getMethodIcon = (method: string) => {
    const found = paymentMethods.find(m => m.id === method);
    return found?.icon || Banknote;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment - ₹{order.total}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total Amount Display */}
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Total Amount</div>
            <div className="text-3xl font-bold text-primary">₹{order.total}</div>
          </div>

          {/* Payment Entries */}
          <div className="space-y-3">
            {payments.map((payment) => {
              const Icon = getMethodIcon(payment.method);
              return (
                <div key={payment.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <select
                    value={payment.method}
                    onChange={(e) => updatePaymentMethod(payment.id, e.target.value)}
                    className="flex-shrink-0 bg-background border border-border rounded px-2 py-1 text-sm"
                  >
                    {paymentMethods.map(m => (
                      <option key={m.id} value={m.id}>{m.label}</option>
                    ))}
                  </select>
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      value={payment.amount || ''}
                      onChange={(e) => updatePayment(payment.id, parseInt(e.target.value) || 0)}
                      className="text-right font-medium"
                    />
                  </div>
                  {payments.length > 1 && (
                    <button
                      onClick={() => removePayment(payment.id)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Payment Button */}
          {remaining > 0 && (
            <button
              onClick={addPayment}
              className="w-full py-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Payment (₹{remaining} remaining)
            </button>
          )}

          {/* Balance Summary */}
          <div className={`p-3 rounded-lg text-center ${
            remaining === 0
              ? 'bg-primary/10 text-primary'
              : remaining > 0
              ? 'bg-warning/10 text-warning'
              : 'bg-destructive/10 text-destructive'
          }`}>
            {remaining === 0 ? (
              <span className="font-medium">Payment Complete</span>
            ) : remaining > 0 ? (
              <span className="font-medium">₹{remaining} remaining</span>
            ) : (
              <span className="font-medium">₹{Math.abs(remaining)} overpaid!</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleConfirm}
              disabled={remaining !== 0}
            >
              Confirm Payment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

