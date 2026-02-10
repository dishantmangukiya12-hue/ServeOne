"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, X } from 'lucide-react';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequest: string;
}

interface MobileCartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  cartTotal: number;
  tax: number;
  total: number;
  taxRate: number;
  hasExistingOrder: boolean;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onUpdateSpecialRequest: (menuItemId: string, request: string) => void;
  onAddCustomItem: () => void;
  onBack: () => void;
  onConfirm: () => void;
  cgstRate?: number;
  sgstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
}

export function MobileCartDialog({
  open,
  onOpenChange,
  cart,
  cartTotal,
  tax,
  total,
  taxRate,
  hasExistingOrder,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateSpecialRequest,
  onAddCustomItem,
  onBack,
  onConfirm,
  cgstRate = 0,
  sgstRate = 0,
  cgstAmount = 0,
  sgstAmount = 0,
}: MobileCartDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-full w-full h-[90vh] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>Your Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length > 0 ? (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.menuItemId} className="bg-card border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.menuItemId)}
                      className="text-destructive/70 hover:text-destructive p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">₹{item.price}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                        className="w-7 h-7 border rounded flex items-center justify-center"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                        className="w-7 h-7 bg-primary text-white rounded flex items-center justify-center"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <Input
                    placeholder="Special Request"
                    value={item.specialRequest}
                    onChange={(e) => onUpdateSpecialRequest(item.menuItemId, e.target.value)}
                    className="text-xs mt-2"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-5xl mb-3">🛒</div>
              <p>Your cart is empty</p>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-4 bg-card">
            <Button
              variant="outline"
              className="w-full mb-4 border-dashed border-primary/20 text-primary"
              onClick={onAddCustomItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add One-Time Item
            </Button>
            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{cartTotal}</span>
              </div>
              {cgstRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>CGST ({cgstRate}%)</span>
                  <span>₹{cgstAmount}</span>
                </div>
              )}
              {sgstRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span>SGST ({sgstRate}%)</span>
                  <span>₹{sgstAmount}</span>
                </div>
              )}
              {taxRate > 0 && cgstRate === 0 && sgstRate === 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({taxRate}%)</span>
                  <span>₹{tax}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onBack}>
                Back
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={onConfirm}
              >
                {hasExistingOrder ? 'Update' : 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

