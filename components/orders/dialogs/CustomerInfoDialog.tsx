"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomerInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerMobile: string;
  setCustomerMobile: (mobile: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function CustomerInfoDialog({
  open,
  onOpenChange,
  customerName,
  setCustomerName,
  customerMobile,
  setCustomerMobile,
  onCancel,
  onSave,
}: CustomerInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer Information</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Customer Name</label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Mobile Number</label>
            <Input
              type="tel"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value)}
              placeholder="Enter mobile number"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              CANCEL
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onSave}>
              SAVE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

