"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  setItemName: (name: string) => void;
  itemPrice: string;
  setItemPrice: (price: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}

export function CustomItemDialog({
  open,
  onOpenChange,
  itemName,
  setItemName,
  itemPrice,
  setItemPrice,
  onCancel,
  onAdd,
}: CustomItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Item Name</label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Enter item name"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Price</label>
            <Input
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              CANCEL
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={onAdd}
              disabled={!itemName.trim() || !itemPrice.trim()}
            >
              ADD ITEM
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

