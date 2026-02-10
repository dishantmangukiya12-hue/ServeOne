"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import type { QROrder } from './QROrdersDialog';

interface QROrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: QROrder | null;
  onReject: (order: QROrder) => void;
  onAccept: (order: QROrder) => void;
}

export function QROrderDetailDialog({
  open,
  onOpenChange,
  order,
  onReject,
  onAccept,
}: QROrderDetailDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Table</p>
              <p className="font-bold text-2xl">{order.tableNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-bold text-2xl text-primary">₹{order.total}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Customer</p>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.customerMobile}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Items</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start bg-muted p-2 rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    {item.specialRequest && (
                      <p className="text-xs text-warning mt-1">Note: {item.specialRequest}</p>
                    )}
                  </div>
                  <p className="font-medium">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onReject(order)}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => onAccept(order)}
            >
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

