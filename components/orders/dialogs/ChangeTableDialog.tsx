"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Table } from '@/types/restaurant';

interface ChangeTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tables: Table[];
  currentTableId: string | undefined;
  onSelectTable: (tableId: string) => void;
  onCancel: () => void;
}

export function ChangeTableDialog({
  open,
  onOpenChange,
  tables,
  currentTableId,
  onSelectTable,
  onCancel,
}: ChangeTableDialogProps) {
  const availableTables = tables.filter(t => t.status === 'available' && !t.mergedWith);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a new table for this order:</p>
          {availableTables.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {availableTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => onSelectTable(table.id)}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    table.id === currentTableId
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-bold text-foreground">{table.tableNumber}</div>
                  <div className="text-xs text-muted-foreground">{table.capacity} seats</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No available tables</p>
          )}
          <Button variant="outline" className="w-full" onClick={onCancel}>
            CANCEL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

