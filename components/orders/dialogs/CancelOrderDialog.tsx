"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const cancelReasons = [
  'Kitchen Issue: missing ingredients',
  'Kitchen Issue: Chef not available',
  'Kitchen Issue: equipment malfunction',
  'Kitchen Issue: Too Cold',
  'Kitchen Issue: Issue with taste',
  'Kitchen Issue: Hair in dish',
  'Kitchen Issue: Rotten ingredients',
  'Owner Cancelled',
  'Customer Dispute',
  'Sold Out',
  'Scanned and Left',
  'Other'
];

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  cancelReason,
  setCancelReason,
  onCancel,
  onConfirm,
}: CancelOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a reason for cancellation:</p>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {cancelReasons.map((reason) => (
              <button
                key={reason}
                onClick={() => setCancelReason(reason)}
                className={`p-3 rounded-lg border text-left text-sm ${
                  cancelReason === reason
                    ? 'bg-destructive/10 border-destructive text-destructive'
                    : 'bg-card border-border hover:bg-muted'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              BACK
            </Button>
            <Button
              className="flex-1 bg-destructive hover:bg-destructive/90"
              onClick={onConfirm}
              disabled={!cancelReason}
            >
              CANCEL ORDER
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

