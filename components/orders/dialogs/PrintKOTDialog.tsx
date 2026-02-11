"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Order, Restaurant, Table } from '@/types/restaurant';

interface PrintKOTDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  restaurant: Restaurant | null;
  selectedTable: Table | null;
  formatOrderTime: (time: string) => string;
  onClose: () => void;
  onPrint: () => void;
}

export function PrintKOTDialog({
  open,
  onOpenChange,
  order,
  restaurant,
  selectedTable,
  formatOrderTime,
  onClose,
  onPrint,
}: PrintKOTDialogProps) {
  if (!order || !restaurant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>KOT - Table {selectedTable?.tableNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border p-4">
            <div className="text-center border-b pb-2 mb-2">
              <p className="font-bold">KITCHEN ORDER TICKET</p>
              <p className="text-xs text-muted-foreground">{restaurant.name}</p>
              <p className="text-xs">{new Date().toLocaleString()}</p>
            </div>

            <div className="text-sm mb-2">
              <p><strong>Table:</strong> {selectedTable?.tableNumber}</p>
              <p><strong>Order #:</strong> {order.id.slice(-6)}</p>
              <p><strong>PAX:</strong> {order.adults + order.kids}</p>
            </div>

            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-1">Item</th>
                  <th className="text-center">Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-1">
                      {item.name}
                      {item.specialRequest && (
                        <div className="text-xs text-muted-foreground">({item.specialRequest})</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatOrderTime(item.addedAt || order.createdAt)}
                      </div>
                    </td>
                    <td className="text-center font-bold">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              CLOSE
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onPrint}>
              PRINT KOT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

