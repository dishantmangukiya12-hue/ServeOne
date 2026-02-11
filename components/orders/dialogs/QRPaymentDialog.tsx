"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types/restaurant';

interface QRPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onClose: () => void;
}

export function QRPaymentDialog({
  open,
  onOpenChange,
  order,
  onClose,
}: QRPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan & Pay</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <div className="w-56 h-56 bg-muted mx-auto rounded-lg flex items-center justify-center">
            <svg className="w-40 h-40 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>

          {order && (
            <div>
              <p className="text-sm text-muted-foreground">Amount to Pay</p>
              <p className="text-2xl font-bold text-primary">₹ {order.total}</p>
            </div>
          )}

          <Button className="w-full bg-primary hover:bg-primary/90" onClick={onClose}>
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

