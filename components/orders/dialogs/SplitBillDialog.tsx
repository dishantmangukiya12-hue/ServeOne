"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Receipt, Check } from 'lucide-react';
import type { Order, OrderItem } from '@/services/dataService';

interface SplitBillDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  onPaySplit: (splitIndex: number, paymentMethod: string, amount: number) => void;
}

type SplitMode = 'equal' | 'items';

interface SplitPayer {
  id: number;
  name: string;
  items: OrderItem[];
  amount: number;
  paid: boolean;
  paymentMethod?: string;
}

export function SplitBillDialog({
  open,
  onClose,
  order,
  onPaySplit,
}: SplitBillDialogProps) {
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [numPayers, setNumPayers] = useState(2);
  const [payers, setPayers] = useState<SplitPayer[]>([]);
  const [, setSelectedPayer] = useState<number | null>(null);
  const [payingPayer, setPayingPayer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    if (open && order) {
      initializeSplit();
    }
  }, [open, order, numPayers, splitMode]);

  const initializeSplit = () => {
    if (!order) return;

    if (splitMode === 'equal') {
      // Split equally
      const amountPerPerson = Math.ceil(order.total / numPayers);
      const newPayers: SplitPayer[] = Array.from({ length: numPayers }, (_, i) => ({
        id: i,
        name: `Guest ${i + 1}`,
        items: [],
        amount: i === numPayers - 1
          ? order.total - (amountPerPerson * (numPayers - 1)) // Last person gets remainder
          : amountPerPerson,
        paid: false
      }));
      setPayers(newPayers);
    } else {
      // Split by items - start with all items unassigned
      const newPayers: SplitPayer[] = Array.from({ length: numPayers }, (_, i) => ({
        id: i,
        name: `Guest ${i + 1}`,
        items: [],
        amount: 0,
        paid: false
      }));
      setPayers(newPayers);
    }
    setSelectedPayer(null);
    setPayingPayer(null);
  };

  const assignItemToPayer = (item: OrderItem, payerId: number) => {
    if (!order) return;

    setPayers(prev => {
      const updated = prev.map(p => ({
        ...p,
        items: p.items.filter(i => i.id !== item.id)
      }));

      const payerIndex = updated.findIndex(p => p.id === payerId);
      if (payerIndex !== -1) {
        updated[payerIndex].items.push(item);
      }

      // Recalculate amounts
      return updated.map(p => ({
        ...p,
        amount: p.items.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      }));
    });
  };

  const getUnassignedItems = (): OrderItem[] => {
    if (!order) return [];
    const assignedIds = new Set(payers.flatMap(p => p.items.map(i => i.id)));
    return order.items.filter(i => !assignedIds.has(i.id));
  };

  const handlePaySplit = () => {
    if (payingPayer === null) return;
    const payer = payers.find(p => p.id === payingPayer);
    if (!payer) return;

    onPaySplit(payingPayer, paymentMethod, payer.amount);

    setPayers(prev => prev.map(p =>
      p.id === payingPayer ? { ...p, paid: true, paymentMethod } : p
    ));
    setPayingPayer(null);
  };

  const allPaid = payers.every(p => p.paid);
  const totalAssigned = payers.reduce((sum, p) => sum + p.amount, 0);
  const unassignedItems = getUnassignedItems();

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Split Bill - ₹{order.total}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Split Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSplitMode('equal')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                splitMode === 'equal'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <Users className="h-4 w-4" />
              Split Equally
            </button>
            <button
              onClick={() => setSplitMode('items')}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                splitMode === 'items'
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <Receipt className="h-4 w-4" />
              Split by Items
            </button>
          </div>

          {/* Number of Payers */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Number of People</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNumPayers(n => Math.max(2, n - 1))}
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent"
              >
                -
              </button>
              <span className="w-8 text-center font-bold">{numPayers}</span>
              <button
                onClick={() => setNumPayers(n => Math.min(10, n + 1))}
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
              >
                +
              </button>
            </div>
          </div>

          {/* Split by Items - Unassigned Items */}
          {splitMode === 'items' && unassignedItems.length > 0 && (
            <div className="border rounded-lg p-3">
              <p className="text-sm font-medium mb-2 text-muted-foreground">
                Unassigned Items (tap to assign)
              </p>
              <div className="space-y-2">
                {unassignedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-warning/10 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{item.quantity}x {item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">₹{item.price * item.quantity}</span>
                      <select
                        onChange={(e) => assignItemToPayer(item, parseInt(e.target.value))}
                        className="text-sm border rounded px-2 py-1 bg-background"
                        defaultValue=""
                      >
                        <option value="" disabled>Assign to...</option>
                        {payers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payers List */}
          <div className="space-y-2">
            {payers.map(payer => (
              <div
                key={payer.id}
                className={`border rounded-lg p-3 transition-colors ${
                  payer.paid
                    ? 'bg-primary/10 border-primary/20'
                    : payingPayer === payer.id
                    ? 'border-info bg-info/10'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {payer.paid && <Check className="h-4 w-4 text-primary" />}
                    <span className="font-medium">{payer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">₹{payer.amount}</span>
                    {!payer.paid && payer.amount > 0 && (
                      <Button
                        size="sm"
                        onClick={() => setPayingPayer(payer.id)}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Pay
                      </Button>
                    )}
                    {payer.paid && (
                      <span className="text-xs text-primary px-2 py-1 bg-primary/10 rounded">
                        {payer.paymentMethod}
                      </span>
                    )}
                  </div>
                </div>

                {/* Show assigned items for item split mode */}
                {splitMode === 'items' && payer.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {payer.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Payment Dialog for Selected Payer */}
          {payingPayer !== null && (
            <div className="border-2 border-info rounded-lg p-4 bg-info/10">
              <h4 className="font-medium mb-3">
                Payment for {payers.find(p => p.id === payingPayer)?.name}
              </h4>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {['Cash', 'UPI', 'Card', 'Online'].map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      paymentMethod === method
                        ? 'bg-info text-white'
                        : 'bg-card border border-border hover:bg-muted'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPayingPayer(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={handlePaySplit}
                >
                  Confirm ₹{payers.find(p => p.id === payingPayer)?.amount}
                </Button>
              </div>
            </div>
          )}

          {/* Summary */}
          {splitMode === 'items' && (
            <div className="text-sm text-muted-foreground text-center">
              Assigned: ₹{totalAssigned} / ₹{order.total}
              {totalAssigned !== order.total && (
                <span className="text-warning ml-2">
                  (₹{order.total - totalAssigned} remaining)
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {allPaid ? 'Done' : 'Cancel'}
            </Button>
            {allPaid && (
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={onClose}
              >
                All Paid - Close Order
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

