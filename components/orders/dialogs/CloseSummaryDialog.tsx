"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Order, Table } from '@/types/restaurant';

interface CloseSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  selectedTable: Table | null;
  paymentMethod: string;
  onDone: () => void;
}

export function CloseSummaryDialog({
  open,
  onOpenChange,
  order,
  selectedTable,
  paymentMethod,
  onDone,
}: CloseSummaryDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Closed Successfully</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Order Closed</div>
            <div className="text-2xl font-bold text-primary">₹ {order.total}</div>
            <div className="text-sm text-muted-foreground mt-1">Payment: {paymentMethod}</div>
          </div>

          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Table:</span>
              <span>{selectedTable?.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order #:</span>
              <span>{order.orderNumber || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items:</span>
              <span>{order.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
            </div>
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90" onClick={onDone}>
            DONE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

