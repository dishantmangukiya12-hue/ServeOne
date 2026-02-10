"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer } from 'lucide-react';
import type { Order } from '@/services/dataService';
import { useRef } from 'react';
import { BillPrint } from './BillPrint';

type PaymentTab = 'UPI_QR' | 'CAPTURE' | 'MARK_NC' | 'PAY_LATER' | 'WALLET';

interface CloseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  tableNumber: string | undefined;
  paymentTab: PaymentTab;
  setPaymentTab: (tab: PaymentTab) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerMobile: string;
  setCustomerMobile: (mobile: string) => void;
  restaurantName?: string;
  onOpenMultiPayment: () => void;
  onCancel: () => void;
  onClose: () => void;
}

export function CloseOrderDialog({
  open,
  onOpenChange,
  order,
  tableNumber,
  paymentTab,
  setPaymentTab,
  paymentMethod,
  setPaymentMethod,
  customerName,
  setCustomerName,
  customerMobile,
  setCustomerMobile,
  restaurantName = 'Restaurant',
  onOpenMultiPayment,
  onCancel,
  onClose,
}: CloseOrderDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && printRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill - Order #${order?.orderNumber}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };
  const paymentTabs: { key: PaymentTab; label: string }[] = [
    { key: 'UPI_QR', label: 'UPI QR' },
    { key: 'CAPTURE', label: 'CAPTURE PAYMENT' },
    { key: 'MARK_NC', label: 'MARK NC' },
    { key: 'PAY_LATER', label: 'PAY LATER' },
    { key: 'WALLET', label: 'WALLET' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Close Order - Table {tableNumber}</DialogTitle>
        </DialogHeader>

        {order && (
          <div className="space-y-4">
            {/* Payment Tabs */}
            <div className="flex border-b">
              {paymentTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPaymentTab(tab.key)}
                  className={`flex-1 py-2 text-xs font-medium ${
                    paymentTab === tab.key
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Amount Display */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Amount to Collect</div>
                <div className="text-3xl font-bold text-primary">₹ {order.total}</div>
              </div>
            </div>

            {/* Tab Content */}
            {paymentTab === 'CAPTURE' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Payment Method</label>
                  <select
                    className="w-full border rounded-lg p-2 mt-1 bg-card"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <button
                  onClick={onOpenMultiPayment}
                  className="w-full py-2 text-sm text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Split Payment (Part Cash + Part UPI)
                </button>
              </div>
            )}

            {paymentTab === 'UPI_QR' && (
              <div className="text-center p-4">
                <div className="w-48 h-48 bg-muted mx-auto rounded-lg flex items-center justify-center">
                  <svg className="w-32 h-32 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Scan to pay ₹ {order.total}</p>
              </div>
            )}

            {paymentTab === 'MARK_NC' && (
              <div className="p-4 bg-warning/10 rounded-lg">
                <p className="text-sm text-warning">
                  This will mark the order as &quot;No Charge&quot; (NC). Use for complimentary orders.
                </p>
              </div>
            )}

            {paymentTab === 'PAY_LATER' && (
              <div className="p-4 bg-info/10 rounded-lg">
                <p className="text-sm text-info">
                  Customer will pay later. Order will remain pending and table will be freed for new customers.
                </p>
              </div>
            )}

            {paymentTab === 'WALLET' && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-primary">
                  Wallet payment options will be shown here.
                </p>
              </div>
            )}

            {/* Customer Info Section */}
            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Customer Information
                {paymentTab === 'PAY_LATER' && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Customer Name
                    {paymentTab === 'PAY_LATER' && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className={`mt-1 ${paymentTab === 'PAY_LATER' && !customerName.trim() ? 'border-destructive' : ''}`}
                    required={paymentTab === 'PAY_LATER'}
                  />
                  {paymentTab === 'PAY_LATER' && !customerName.trim() && (
                    <p className="text-xs text-destructive mt-1">Required for Pay Later</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Mobile Number
                    {paymentTab === 'PAY_LATER' && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </label>
                  <Input
                    type="tel"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="Enter mobile number"
                    className={`mt-1 ${paymentTab === 'PAY_LATER' && !customerMobile.trim() ? 'border-destructive' : ''}`}
                    required={paymentTab === 'PAY_LATER'}
                  />
                  {paymentTab === 'PAY_LATER' && !customerMobile.trim() && (
                    <p className="text-xs text-destructive mt-1">Required for Pay Later</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={onCancel}
              >
                CANCEL
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                PRINT BILL
              </Button>
              <Button 
                className={`flex-1 ${paymentTab === 'PAY_LATER' ? 'bg-info hover:bg-info/90' : 'bg-primary hover:bg-primary/90'}`} 
                onClick={onClose}
                disabled={paymentTab === 'PAY_LATER' && (!customerName.trim() || !customerMobile.trim())}
              >
                {paymentTab === 'PAY_LATER' ? 'CONFIRM PAY LATER' : 'CLOSE ORDER'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Hidden Bill Print Component */}
        <div style={{ display: 'none' }}>
          <div ref={printRef}>
            <BillPrint
              order={order}
              restaurantName={restaurantName}
              tableNumber={tableNumber}
              paymentMethod={paymentMethod}
              customerName={customerName}
              customerMobile={customerMobile}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

