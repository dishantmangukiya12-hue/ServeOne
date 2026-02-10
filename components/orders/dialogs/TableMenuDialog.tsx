"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Printer, Plus, User } from 'lucide-react';
import type { Table } from '@/services/dataService';

interface TableMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  onShowQR: () => void;
  onPrintKOT: () => void;
  onSendBill: () => void;
  onGenerateBill: () => void;
  onSplitBill: () => void;
  onChangeTable: () => void;
  onCancelOrder: () => void;
  onCloseOrder: () => void;
  onAddCustomerInfo: () => void;
}

export function TableMenuDialog({
  open,
  onOpenChange,
  table,
  onShowQR,
  onPrintKOT,
  onSendBill,
  onGenerateBill,
  onSplitBill,
  onChangeTable,
  onCancelOrder,
  onCloseOrder,
  onAddCustomerInfo,
}: TableMenuDialogProps) {
  const menuItems = [
    { icon: 'qr', label: 'Show QR Pin', action: onShowQR },
    { icon: 'print', label: 'Print KOT', action: onPrintKOT },
    { icon: 'bill', label: 'Send Bill', action: onSendBill },
    { icon: 'generate', label: 'Generate Bill', action: onGenerateBill },
    { icon: 'split', label: 'Split Bill', action: onSplitBill },
    { icon: 'table', label: 'Change Table', action: onChangeTable },
    { icon: 'cancel', label: 'Cancel Order', action: onCancelOrder },
    { icon: 'scan', label: 'Scan and Pay QR', action: onShowQR },
    { icon: 'close', label: 'Close Order', action: onCloseOrder },
    { icon: 'customer', label: 'Add Customer Info', action: onAddCustomerInfo },
    { icon: 'pax', label: 'Update PAX', action: () => {} },
    { icon: 'waiter', label: 'Update Waiter', action: () => {} },
  ];

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'qr':
      case 'scan':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        );
      case 'print':
        return <Printer className="w-5 h-5" />;
      case 'bill':
      case 'generate':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
        );
      case 'table':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 6v13a2 2 0 002 2h14a2 2 0 002-2V6" />
            <path d="M12 6v15" />
          </svg>
        );
      case 'cancel':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'close':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        );
      case 'split':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
          </svg>
        );
      case 'customer':
        return <Plus className="w-5 h-5" />;
      case 'pax':
      case 'waiter':
        return <User className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center text-4xl font-normal">{table?.tableNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onOpenChange(false);
                item.action();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg text-left"
            >
              <span className="text-primary">
                {renderIcon(item.icon)}
              </span>
              <span className="text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

