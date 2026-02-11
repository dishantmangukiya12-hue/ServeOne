"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Order, Restaurant, Table } from '@/types/restaurant';

interface GenerateBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  restaurant: Restaurant | null;
  selectedTable: Table | null;
  settings: { taxRate: number; serviceCharge: number; tax?: { cgst: number; sgst: number; serviceCharge: number } };
  discountAmount: string;
  setDiscountAmount: (amount: string) => void;
  discountPercent: string;
  setDiscountPercent: (percent: string) => void;
  billNote: string;
  setBillNote: (note: string) => void;
  applyGST: boolean;
  setApplyGST: (apply: boolean) => void;
  splitBillCount: number;
  setSplitBillCount: (count: number) => void;
  onSplitBill: () => void;
  onCancel: () => void;
  onPrint: () => void;
  formatOrderTime: (time: string) => string;
}

export function GenerateBillDialog({
  open,
  onOpenChange,
  order,
  restaurant,
  selectedTable,
  settings,
  discountAmount,
  setDiscountAmount,
  discountPercent,
  setDiscountPercent,
  billNote,
  setBillNote,
  applyGST,
  setApplyGST,
  splitBillCount,
  setSplitBillCount,
  onSplitBill,
  onCancel,
  onPrint,
  formatOrderTime,
}: GenerateBillDialogProps) {
  if (!order || !restaurant) return null;

  const billSubtotal = order.subTotal || 0;
  const cgstRate = settings.tax?.cgst || 0;
  const sgstRate = settings.tax?.sgst || 0;
  const hasSplitGST = cgstRate > 0 || sgstRate > 0;
  const billCgst = applyGST ? Math.round(billSubtotal * (cgstRate / 100)) : 0;
  const billSgst = applyGST ? Math.round(billSubtotal * (sgstRate / 100)) : 0;
  const billTax = applyGST ? (hasSplitGST ? billCgst + billSgst : (order.tax || 0)) : 0;
  const billDiscount = parseFloat(discountAmount || '0') || (billSubtotal * parseFloat(discountPercent || '0') / 100);
  const billTotal = billSubtotal + billTax - billDiscount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bill - Table {selectedTable?.tableNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Restaurant Header */}
          <div className="border-b pb-2 text-center">
            <p className="font-bold text-lg">{restaurant.name}</p>
            <p className="text-xs text-muted-foreground">{restaurant.address}</p>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleString()}</p>
          </div>

          {/* Customer Info */}
          <div className="text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span>{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mobile:</span>
              <span>{order.customerMobile || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Table:</span>
              <span>{selectedTable?.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">PAX:</span>
              <span>{order.adults} Adults, {order.kids} Kids</span>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr className="border-b">
                <th className="text-left py-1">Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="py-1">
                    <div>{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatOrderTime(item.addedAt || order.createdAt)}
                    </div>
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹ {item.price}</td>
                  <td className="text-right">₹ {item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Discount Section */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Apply Discount</div>
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                placeholder="Amount (₹)"
                value={discountAmount}
                onChange={(e) => {
                  setDiscountAmount(e.target.value);
                  setDiscountPercent('');
                }}
                className="flex-1"
              />
              <span className="self-center">or</span>
              <Input
                type="number"
                placeholder="%"
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(e.target.value);
                  setDiscountAmount('');
                }}
                className="w-20"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-muted-foreground">Notes</label>
            <Input
              placeholder="Add notes to bill..."
              value={billNote}
              onChange={(e) => setBillNote(e.target.value)}
            />
          </div>

          {/* GST Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="rounded"
              checked={applyGST}
              onChange={(e) => setApplyGST(e.target.checked)}
            />
            <span className="text-sm text-muted-foreground">Apply GST</span>
          </div>

          {/* Split Bill */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Split Bill:</span>
            <Input
              type="number"
              min={1}
              value={splitBillCount}
              onChange={(e) => setSplitBillCount(parseInt(e.target.value) || 1)}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">ways</span>
            <Button size="sm" variant="outline" onClick={onSplitBill}>
              SPLIT
            </Button>
          </div>

          {/* Totals */}
          <div className="border-t pt-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹ {billSubtotal}</span>
            </div>
            {applyGST && hasSplitGST && billCgst > 0 && (
              <div className="flex justify-between text-sm">
                <span>CGST ({cgstRate}%)</span>
                <span>₹ {billCgst}</span>
              </div>
            )}
            {applyGST && hasSplitGST && billSgst > 0 && (
              <div className="flex justify-between text-sm">
                <span>SGST ({sgstRate}%)</span>
                <span>₹ {billSgst}</span>
              </div>
            )}
            {applyGST && !hasSplitGST && billTax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax ({settings.taxRate}%)</span>
                <span>₹ {billTax}</span>
              </div>
            )}
            {billDiscount > 0 && (
              <div className="flex justify-between text-sm text-destructive">
                <span>Discount</span>
                <span>-₹ {billDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total</span>
              <span>₹ {billTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              CANCEL
            </Button>
            <Button variant="outline" className="flex-1" onClick={onSplitBill}>
              SPLIT BILL
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onPrint}>
              PRINT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

