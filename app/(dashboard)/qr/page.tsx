"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/hooks/useServerSync';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Copy, Check, Smartphone, Utensils, Info, Eye } from 'lucide-react';
import type { Table } from '@/services/dataService';
import { getRestaurantData } from '@/services/dataService';
import { toast } from 'sonner';
import QROrderManager from '@/components/QROrderManager';

// Simple QR code visual representation - declared outside component
function QRVisual({ tableNumber }: { tableNumber: string }) {
  // Use deterministic pattern based on tableNumber to avoid random on every render
  const seed = tableNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return (
    <div className="w-32 h-32 bg-white border-2 border-foreground rounded-xl p-2 relative">
      <div className="w-full h-full bg-foreground rounded-lg relative overflow-hidden">
        {/* QR Pattern simulation */}
        <div className="absolute inset-1 grid grid-cols-7 grid-rows-7 gap-0.5">
          {Array.from({ length: 49 }).map((_, i) => (
            <div
              key={i}
              className={`${
                [0,1,2,6,7,8,13,14,20,27,34,41,42,43,47,48].includes(i)
                  ? 'bg-white'
                  : ((seed + i) % 2 === 0) ? 'bg-white' : 'bg-foreground'
              }`}
            />
          ))}
        </div>
        {/* Corner markers */}
        <div className="absolute top-1 left-1 w-4 h-4 border-2 border-white rounded-sm" />
        <div className="absolute top-1 right-1 w-4 h-4 border-2 border-white rounded-sm" />
        <div className="absolute bottom-1 left-1 w-4 h-4 border-2 border-white rounded-sm" />
      </div>
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className="text-xs font-bold text-muted-foreground">Table {tableNumber}</span>
      </div>
    </div>
  );
}

export default function QROrdering() {
  const { restaurant } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [copied, setCopied] = useState(false);
  const [showOrderManager, setShowOrderManager] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setTables(data.tables.filter(t => !t.mergedWith));
    }
  }, [restaurant?.id]);

  const loadTables = () => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setTables(data.tables.filter(t => !t.mergedWith));
    }
  };
  useDataRefresh(loadTables);

  const generateQRUrl = (tableNumber: string) => {
    if (!restaurant) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/order/${restaurant.id}/${tableNumber}`;
  };

  const handleCopyLink = (tableNumber: string) => {
    const url = generateQRUrl(tableNumber);
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = (tableNumber: string) => {
    toast.success(`QR code for Table ${tableNumber} downloaded`);
  };

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* QR Order Manager Floating Button */}
      <QROrderManager
        restaurant={restaurant}
        isOpen={showOrderManager}
        onClose={() => setShowOrderManager(!showOrderManager)}
      />

      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-3 rounded-xl">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">QR Code Ordering</h1>
              <p className="text-muted-foreground text-sm">Let customers order from their table</p>
            </div>
          </div>

          <Button
            onClick={() => setShowOrderManager(true)}
            className="bg-primary hover:bg-primary/90"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Incoming Orders
          </Button>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-6 bg-primary/10 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg mb-2">How QR Ordering Works</h3>
              <ol className="text-muted-foreground space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  Print and place QR codes on each table
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  Customer scans QR code with their phone camera
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  They browse menu and place order directly from their phone
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  You receive a notification to accept/reject the order
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">5.</span>
                  When accepted, order is automatically placed on that table
                </li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Utensils className="h-6 w-6 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">Contactless Ordering</h4>
            <p className="text-sm text-muted-foreground">Customers order without waiting for staff</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="w-12 h-12 bg-info/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-info" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">Manager Approval</h4>
            <p className="text-sm text-muted-foreground">Review and accept orders before processing</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Info className="h-6 w-6 text-warning" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">Auto Table Assignment</h4>
            <p className="text-sm text-muted-foreground">Orders automatically assigned to correct table</p>
          </Card>
        </div>

        {/* QR Codes Grid */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted">
            <h3 className="font-semibold text-foreground">Table QR Codes</h3>
            <p className="text-sm text-muted-foreground mt-1">Print these and place on respective tables</p>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="border border-border rounded-xl p-4 text-center hover:border-primary/30 hover:shadow-md transition-all cursor-pointer bg-background"
                  onClick={() => setSelectedTable(table)}
                >
                  <div className="flex justify-center mb-3">
                    <QRVisual tableNumber={table.tableNumber} />
                  </div>
                  <div className="mt-6 font-bold text-foreground">Table {table.tableNumber}</div>
                  <div className="text-xs text-muted-foreground">{table.capacity} seats</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Selected Table QR Modal */}
        {selectedTable && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Table {selectedTable.tableNumber} QR Code
                </h3>

                <div className="flex justify-center mb-4">
                  <div className="w-48 h-48">
                    <QRVisual tableNumber={selectedTable.tableNumber} />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Scan this code to open the menu and order
                </p>

                <div className="bg-muted p-3 rounded-lg mb-4">
                  <code className="text-xs text-muted-foreground break-all">
                    {generateQRUrl(selectedTable.tableNumber)}
                  </code>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCopyLink(selectedTable.tableNumber)}
                  >
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? 'Copied' : 'Copy Link'}
                  </Button>
                  <Button
                    className="flex-1 bg-primary hover:bg-primary/90"
                    onClick={() => handleDownloadQR(selectedTable.tableNumber)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-2"
                  onClick={() => setSelectedTable(null)}
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Print Instructions */}
        <Card className="mt-6 p-6">
          <h3 className="font-semibold text-foreground mb-4">Printing Instructions</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>1. Download the QR codes for all tables you want to enable</p>
            <p>2. Print them on cardstock or waterproof paper for durability</p>
            <p>3. Recommended size: 3x3 inches (7.5x7.5 cm) minimum for easy scanning</p>
            <p>4. Place them in table stands or laminate and stick to tables</p>
            <p>5. Test scan each code before placing on tables</p>
          </div>
        </Card>
      </main>
    </div>
  );
}

