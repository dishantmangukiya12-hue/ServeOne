"use client";

import { Card } from '@/components/ui/card';
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

interface OrderCartProps {
  cart: CartItem[];
  cartTotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
  taxRate: number;
  serviceChargeRate: number;
  hasExistingOrder: boolean;
  onAddCustomItem: () => void;
  onClearOrCancel: () => void;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onUpdateSpecialRequest: (menuItemId: string, request: string) => void;
  onConfirmOrder: () => void;
  cgstRate?: number;
  sgstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
}

export function OrderCart({
  cart,
  cartTotal,
  tax,
  serviceCharge,
  total,
  taxRate,
  serviceChargeRate,
  hasExistingOrder,
  onAddCustomItem,
  onClearOrCancel,
  onUpdateQuantity,
  onRemoveItem,
  onUpdateSpecialRequest,
  onConfirmOrder,
  cgstRate = 0,
  sgstRate = 0,
  cgstAmount = 0,
  sgstAmount = 0,
}: OrderCartProps) {
  return (
    <div className="w-80 xl:w-96 bg-card border-l p-4 overflow-y-auto relative flex-shrink-0 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onAddCustomItem}
          className="text-primary font-medium hover:text-primary/80 flex items-center gap-1 text-sm"
        >
          <Plus className="h-4 w-4" /> Add Custom Item
        </button>
        {cart.length > 0 && (
          <button
            onClick={onClearOrCancel}
            className="text-destructive text-sm hover:text-destructive/80"
          >
            {hasExistingOrder ? 'CANCEL ORDER' : 'CLEAR CART'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {cart.length > 0 ? (
          cart.map((item) => (
            <Card key={item.menuItemId} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
                <button
                  onClick={() => onRemoveItem(item.menuItemId)}
                  className="text-destructive/70 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">₹ {item.price}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                    className="w-6 h-6 border rounded flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                    className="w-6 h-6 bg-primary text-white rounded flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <Input
                placeholder="Special Request"
                value={item.specialRequest}
                onChange={(e) => onUpdateSpecialRequest(item.menuItemId, e.target.value)}
                className="text-sm"
              />
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">🛒</div>
            <p className="text-sm">Your cart is empty</p>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm mb-1">
            <span>Subtotal</span>
            <span>₹ {cartTotal}</span>
          </div>
          {cgstRate > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span>CGST ({cgstRate}%)</span>
              <span>₹ {cgstAmount}</span>
            </div>
          )}
          {sgstRate > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span>SGST ({sgstRate}%)</span>
              <span>₹ {sgstAmount}</span>
            </div>
          )}
          {taxRate > 0 && cgstRate === 0 && sgstRate === 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span>Tax ({taxRate}%)</span>
              <span>₹ {tax}</span>
            </div>
          )}
          {serviceChargeRate > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span>Service Charge ({serviceChargeRate}%)</span>
              <span>₹ {serviceCharge}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-lg mt-2">
            <span>Total</span>
            <span>₹ {total}</span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <Button
          className="w-full bg-primary hover:bg-primary/90"
          disabled={cart.length === 0}
          onClick={onConfirmOrder}
        >
          {hasExistingOrder ? 'UPDATE ORDER' : 'CONFIRM ORDER'}
        </Button>
      </div>
    </div>
  );
}

