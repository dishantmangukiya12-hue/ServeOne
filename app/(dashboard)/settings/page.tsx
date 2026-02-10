"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Store, Bell, CreditCard, Shield, Download, Upload, Table as TableIcon, Plus, Minus, Printer as PrinterIcon, Trash2, X, Receipt, IndianRupee } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Table, Printer as PrinterType } from '@/services/dataService';
import {
  getRestaurantData,
  saveRestaurantData,
  exportData,
  importData,
  clearAllData,
  updateRestaurantRemote,
  updateRestaurantPasscodeRemote,
  addPrinter,
  updatePrinter,
  deletePrinter,
  getPrinters,
} from '@/services/dataService';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/hooks/useServerSync';

export default function Settings() {
  const router = useRouter();
  const { restaurant, logout } = useAuth();
  const [name, setName] = useState(restaurant?.name || '');
  const [mobile, setMobile] = useState(restaurant?.mobile || '');
  const [address, setAddress] = useState(restaurant?.address || '');
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [notifications, setNotifications] = useState({
    newOrder: true,
    orderCancel: true,
    payment: true,
    lowStock: false,
    dailySummary: false
  });
  const [payments, setPayments] = useState({
    cash: true,
    upi: true,
    card: true,
    online: false
  });
  const [tables, setTables] = useState<Table[]>([]);
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null);
  const [printerName, setPrinterName] = useState('');
  const [printerType, setPrinterType] = useState<'bill' | 'kitchen' | 'both'>('bill');
  const [printerPaperSize, setPrinterPaperSize] = useState<'58mm' | '80mm' | 'a4'>('80mm');
  const [printerIsDefault, setPrinterIsDefault] = useState(false);
  const [printerIsActive, setPrinterIsActive] = useState(true);

  // Tax settings
  const [cgst, setCgst] = useState('2.5');
  const [sgst, setSgst] = useState('2.5');
  const [taxServiceCharge, setTaxServiceCharge] = useState('0');

  // Receipt settings
  const [receiptHeader, setReceiptHeader] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for dining with us!');
  const [gstNumber, setGstNumber] = useState('');
  const [showGstNumber, setShowGstNumber] = useState(false);

  // Load data on mount - must be before any conditional returns
  useEffect(() => {
    if (restaurant) {
      const data = getRestaurantData(restaurant.id);
      if (data) {
        setTables(data.tables);
        setPrinters(data.printers);
        if (data.settings?.tax) {
          setCgst(String(data.settings.tax.cgst || 0));
          setSgst(String(data.settings.tax.sgst || 0));
          setTaxServiceCharge(String(data.settings.tax.serviceCharge || 0));
        }
        if (data.settings?.receipt) {
          setReceiptHeader(data.settings.receipt.header || '');
          setReceiptFooter(data.settings.receipt.footer || 'Thank you for dining with us!');
          setGstNumber(data.settings.receipt.gstNumber || '');
          setShowGstNumber(data.settings.receipt.showGstNumber || false);
        }
        if (data.settings?.notifications) {
          setNotifications(prev => ({ ...prev, ...data.settings.notifications }));
        }
        if (data.settings?.payments) {
          setPayments(prev => ({ ...prev, ...data.settings.payments }));
        }
      }
    }
  }, [restaurant]);

  const reloadSettings = () => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setTables(data.tables);
      setPrinters(data.printers);
    }
  };
  useDataRefresh(reloadSettings);

  if (!restaurant) return null;

  const loadTables = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setTables(data.tables);
    }
  };

  const loadPrinters = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setPrinters(data.printers);
    }
  };

  const handleSaveRestaurant = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      data.restaurant.name = name;
      data.restaurant.mobile = mobile;
      data.restaurant.address = address;
      saveRestaurantData(restaurant.id, data);
      void updateRestaurantRemote(restaurant.id, { name, mobile, address });
    }
  };

  const handleChangePasscode = () => {
    if (newPasscode !== confirmPasscode) {
      return;
    }
    if (newPasscode.length < 4) {
      return;
    }

    const data = getRestaurantData(restaurant.id);
    if (data) {
      if (data.restaurant.passcode !== currentPasscode) {
        return;
      }
      data.restaurant.passcode = newPasscode;
      saveRestaurantData(restaurant.id, data);
      void updateRestaurantPasscodeRemote(restaurant.id, newPasscode);
      setCurrentPasscode('');
      setNewPasscode('');
      setConfirmPasscode('');
    }
  };

  const handleExport = () => {
    const data = exportData(restaurant.id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menew_backup_${restaurant.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonData = event.target?.result as string;
      if (importData(restaurant.id, jsonData)) {
        window.location.reload();
      }
    };
    reader.readAsText(file);
  };

  const handleAddTable = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      const newTableNumber = String(tables.length + 1).padStart(2, '0');
      const newTable = {
        id: `table_${restaurant.id}_${tables.length + 1}`,
        restaurantId: restaurant.id,
        tableNumber: newTableNumber,
        capacity: 4,
        status: 'available' as const
      };
      data.tables.push(newTable);
      saveRestaurantData(restaurant.id, data);
      setTables([...data.tables]);
    }
  };

  const handleRemoveTable = () => {
    const availableTables = tables.filter(t => t.status === 'available');
    if (availableTables.length === 0) {
      return;
    }
    const lastTable = availableTables[availableTables.length - 1];
    if (confirm(`Remove Table ${lastTable.tableNumber}?`)) {
      const data = getRestaurantData(restaurant.id);
      if (data) {
        data.tables = data.tables.filter(t => t.id !== lastTable.id);
        saveRestaurantData(restaurant.id, data);
        setTables([...data.tables]);
      }
    }
  };

  const handleClearData = () => {
    if (confirm('WARNING: This will delete ALL your data. This action cannot be undone. Are you sure?')) {
      if (prompt('Type "DELETE" to confirm:') === 'DELETE') {
        clearAllData();
        logout();
        router.push('/login');
      }
    }
  };

  const handleSavePrinter = () => {
    if (!printerName.trim()) return;
    
    const printerData = {
      id: editingPrinter?.id || `printer_${Date.now()}`,
      restaurantId: restaurant.id,
      name: printerName,
      type: printerType,
      paperSize: printerPaperSize,
      isDefault: printerIsDefault,
      isActive: printerIsActive,
    };

    if (editingPrinter) {
      updatePrinter(restaurant.id, editingPrinter.id, printerData);
    } else {
      addPrinter(restaurant.id, printerData);
    }

    loadPrinters();
    setShowPrinterDialog(false);
    setEditingPrinter(null);
    setPrinterName('');
    setPrinterType('bill');
    setPrinterPaperSize('80mm');
    setPrinterIsDefault(false);
    setPrinterIsActive(true);
  };

  const handleEditPrinter = (printer: PrinterType) => {
    setEditingPrinter(printer);
    setPrinterName(printer.name);
    setPrinterType(printer.type);
    setPrinterPaperSize(printer.paperSize);
    setPrinterIsDefault(printer.isDefault);
    setPrinterIsActive(printer.isActive);
    setShowPrinterDialog(true);
  };

  const handleDeletePrinter = (printerId: string) => {
    if (confirm('Are you sure you want to delete this printer?')) {
      deletePrinter(restaurant.id, printerId);
      loadPrinters();
    }
  };

  const openAddPrinter = () => {
    setEditingPrinter(null);
    setPrinterName('');
    setPrinterType('bill');
    setPrinterPaperSize('80mm');
    setPrinterIsDefault(false);
    setPrinterIsActive(true);
    setShowPrinterDialog(true);
  };

  const handleSaveTaxSettings = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      data.settings = {
        ...data.settings,
        tax: {
          cgst: parseFloat(cgst) || 0,
          sgst: parseFloat(sgst) || 0,
          serviceCharge: parseFloat(taxServiceCharge) || 0,
        },
        taxRate: (parseFloat(cgst) || 0) + (parseFloat(sgst) || 0),
        serviceCharge: parseFloat(taxServiceCharge) || 0,
      };
      saveRestaurantData(restaurant.id, data);
      void updateRestaurantRemote(restaurant.id, { settings: data.settings });
    }
  };

  const handleSaveReceiptSettings = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      data.settings = {
        ...data.settings,
        receipt: {
          header: receiptHeader,
          footer: receiptFooter,
          gstNumber,
          showGstNumber,
        },
      };
      saveRestaurantData(restaurant.id, data);
      void updateRestaurantRemote(restaurant.id, { settings: data.settings });
    }
  };

  const handleSaveNotifications = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      data.settings = {
        ...data.settings,
        notifications,
      };
      saveRestaurantData(restaurant.id, data);
      void updateRestaurantRemote(restaurant.id, { settings: data.settings });
    }
  };

  const handleSavePayments = () => {
    const data = getRestaurantData(restaurant.id);
    if (data) {
      data.settings = {
        ...data.settings,
        payments,
      };
      saveRestaurantData(restaurant.id, data);
      void updateRestaurantRemote(restaurant.id, { settings: data.settings });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">Settings</h1>

        <Tabs defaultValue="restaurant" className="w-full">
          <TabsList className="grid w-full md:max-w-5xl grid-cols-5 sm:grid-cols-9 md:grid-cols-9 h-auto">
            <TabsTrigger value="restaurant" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <Store className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Restaurant</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <TableIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Tables</span>
              <span className="sm:hidden">Tables</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <Shield className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Safe</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Data</span>
              <span className="sm:hidden">Backup</span>
            </TabsTrigger>
            <TabsTrigger value="printers" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <PrinterIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Printers</span>
              <span className="sm:hidden">Print</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <IndianRupee className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Tax / GST</span>
              <span className="sm:hidden">Tax</span>
            </TabsTrigger>
            <TabsTrigger value="receipt" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-2.5 px-1 text-[10px] md:text-sm">
              <Receipt className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Receipt</span>
              <span className="sm:hidden">Bill</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <h2 className="text-base md:text-lg font-medium mb-4">Restaurant Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Restaurant Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Mobile Number</label>
                  <Input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm"
                  onClick={handleSaveRestaurant}
                >
                  Save Changes
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <h2 className="text-base md:text-lg font-medium mb-4">Manage Tables</h2>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleAddTable}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Table
                  </button>
                  <button
                    onClick={handleRemoveTable}
                    className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                    Remove Last
                  </button>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-3">Current Tables ({tables.length})</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {tables.map((table) => (
                      <div
                        key={table.id}
                        className={`p-3 rounded-lg text-center ${
                          table.status === 'occupied'
                            ? 'bg-warning/10 border-2 border-warning/30'
                            : 'bg-primary/5 border-2 border-primary/20'
                        }`}
                      >
                        <div className="font-bold text-foreground">{table.tableNumber}</div>
                        <select
                          value={table.section || ''}
                          onChange={(e) => {
                            const data = getRestaurantData(restaurant.id);
                            if (data) {
                              const t = data.tables.find(tt => tt.id === table.id);
                              if (t) t.section = e.target.value || undefined;
                              saveRestaurantData(restaurant.id, data);
                              setTables([...data.tables]);
                            }
                          }}
                          className="w-full mt-1 text-[10px] bg-transparent border-0 text-center text-muted-foreground p-0 focus:ring-0"
                        >
                          <option value="">No Section</option>
                          <option value="Indoor">Indoor</option>
                          <option value="Outdoor">Outdoor</option>
                          <option value="Bar">Bar</option>
                          <option value="Private">Private</option>
                          <option value="Terrace">Terrace</option>
                        </select>
                        <div className={`text-[10px] ${
                          table.status === 'occupied' ? 'text-warning' : 'text-primary'
                        }`}>
                          {table.status === 'occupied' ? 'Occupied' : 'Free'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <h2 className="text-base md:text-lg font-medium mb-4">Notification Settings</h2>
              <div className="space-y-4">
                {[
                  { key: 'newOrder', label: 'New Order Notifications' },
                  { key: 'orderCancel', label: 'Order Cancellation Alerts' },
                  { key: 'payment', label: 'Payment Received' },
                  { key: 'lowStock', label: 'Low Stock Alerts' },
                  { key: 'dailySummary', label: 'Daily Summary Email' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs md:text-sm">{label}</span>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={(checked) =>
                        setNotifications(prev => ({ ...prev, [key]: checked }))
                      }
                      className="data-[state=checked]:bg-primary scale-75 md:scale-100"
                    />
                  </div>
                ))}
                <Button
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm mt-4"
                  onClick={handleSaveNotifications}
                >
                  Save Notification Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <h2 className="text-base md:text-lg font-medium mb-4">Payment Methods</h2>
              <div className="space-y-4">
                {[
                  { key: 'cash', label: 'Cash' },
                  { key: 'upi', label: 'UPI' },
                  { key: 'card', label: 'Credit/Debit Card' },
                  { key: 'online', label: 'Online Payment' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs md:text-sm">{label}</span>
                    <Switch
                      checked={payments[key as keyof typeof payments]}
                      onCheckedChange={(checked) =>
                        setPayments(prev => ({ ...prev, [key]: checked }))
                      }
                      className="data-[state=checked]:bg-primary scale-75 md:scale-100"
                    />
                  </div>
                ))}
                <Button
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm mt-4"
                  onClick={handleSavePayments}
                >
                  Save Payment Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <h2 className="text-base md:text-lg font-medium mb-4">Change Passcode</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Current Passcode</label>
                  <Input
                    type="password"
                    value={currentPasscode}
                    onChange={(e) => setCurrentPasscode(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">New Passcode</label>
                  <Input
                    type="password"
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Confirm New Passcode</label>
                  <Input
                    type="password"
                    value={confirmPasscode}
                    onChange={(e) => setConfirmPasscode(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm"
                  onClick={handleChangePasscode}
                >
                  Update Passcode
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl mb-4">
              <h2 className="text-base md:text-lg font-medium mb-4">Backup & Restore</h2>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-muted rounded-lg gap-3">
                  <div>
                    <div className="font-medium text-sm">Export Data</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Download a backup of all your data</div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-muted rounded-lg gap-3">
                  <div>
                    <div className="font-medium text-sm">Import Data</div>
                    <div className="text-xs md:text-sm text-muted-foreground">Restore from a backup file</div>
                  </div>
                  <label className="cursor-pointer inline-flex w-full sm:w-auto">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                    <span className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm w-full sm:w-auto">
                      <Upload className="h-4 w-4" />
                      Import
                    </span>
                  </label>
                </div>
              </div>
            </Card>

            <Card className="p-4 md:p-6 md:max-w-2xl border-destructive/30">
              <h2 className="text-base md:text-lg font-medium mb-4 text-destructive">Danger Zone</h2>
              <div className="p-3 md:p-4 bg-destructive/5 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-destructive text-sm">Clear All Data</div>
                    <div className="text-xs md:text-sm text-destructive/80">This will permanently delete all your data</div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleClearData}
                    className="text-sm w-full sm:w-auto"
                  >
                    Clear Data
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="printers" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base md:text-lg font-medium">Printer Management</h2>
                <Button
                  onClick={openAddPrinter}
                  className="bg-primary hover:bg-primary/90 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Printer
                </Button>
              </div>
              
              <div className="space-y-3">
                {printers?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No printers configured. Click "Add Printer" to set up a printer.
                  </p>
                ) : (
                  printers?.map((printer) => (
                    <div
                      key={printer.id}
                      className="flex items-center justify-between p-3 md:p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {printer.name}
                          {printer.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                          {!printer.isActive && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Type: {printer.type} | Paper: {printer.paperSize}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPrinter(printer)}
                          className="text-xs"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePrinter(printer.id)}
                          className="text-xs text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <h2 className="text-base md:text-lg font-medium mb-4">GST Tax Configuration</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Configure CGST and SGST rates as per Indian GST regulations. These rates will be applied to all orders.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs md:text-sm text-muted-foreground">CGST Rate (%)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={cgst}
                      onChange={(e) => setCgst(e.target.value)}
                      placeholder="2.5"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs md:text-sm text-muted-foreground">SGST Rate (%)</label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={sgst}
                      onChange={(e) => setSgst(e.target.value)}
                      placeholder="2.5"
                      className="text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Service Charge (%)</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    value={taxServiceCharge}
                    onChange={(e) => setTaxServiceCharge(e.target.value)}
                    placeholder="0"
                    className="text-sm"
                  />
                </div>

                {/* Live preview */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-xs font-medium mb-2">Preview (on ₹1,000 order)</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹1,000</span>
                    </div>
                    {parseFloat(cgst) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>CGST ({cgst}%)</span>
                        <span>₹{((1000 * parseFloat(cgst)) / 100).toFixed(0)}</span>
                      </div>
                    )}
                    {parseFloat(sgst) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>SGST ({sgst}%)</span>
                        <span>₹{((1000 * parseFloat(sgst)) / 100).toFixed(0)}</span>
                      </div>
                    )}
                    {parseFloat(taxServiceCharge) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Service Charge ({taxServiceCharge}%)</span>
                        <span>₹{((1000 * parseFloat(taxServiceCharge)) / 100).toFixed(0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Total</span>
                      <span>
                        ₹{(1000 + (1000 * (parseFloat(cgst) || 0)) / 100 + (1000 * (parseFloat(sgst) || 0)) / 100 + (1000 * (parseFloat(taxServiceCharge) || 0)) / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm"
                  onClick={handleSaveTaxSettings}
                >
                  Save Tax Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="receipt" className="mt-4 md:mt-6">
            <Card className="p-4 md:p-6 md:max-w-2xl">
              <h2 className="text-base md:text-lg font-medium mb-4">Receipt Customization</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Customize how your bills and receipts look when printed.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Receipt Header</label>
                  <Input
                    value={receiptHeader}
                    onChange={(e) => setReceiptHeader(e.target.value)}
                    placeholder="e.g., Welcome to our restaurant!"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Displayed above the restaurant name on the receipt</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">Receipt Footer</label>
                  <Input
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    placeholder="Thank you for dining with us!"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Displayed at the bottom of the receipt</p>
                </div>
                <div>
                  <label className="text-xs md:text-sm text-muted-foreground">GSTIN Number</label>
                  <Input
                    value={gstNumber}
                    onChange={(e) => setGstNumber(e.target.value)}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm">Show GSTIN on Receipt</span>
                  <Switch
                    checked={showGstNumber}
                    onCheckedChange={setShowGstNumber}
                    className="data-[state=checked]:bg-primary scale-75 md:scale-100"
                  />
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm"
                  onClick={handleSaveReceiptSettings}
                >
                  Save Receipt Settings
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Printer Dialog */}
      <Dialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPrinter ? 'Edit Printer' : 'Add Printer'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Printer Name</label>
              <Input
                value={printerName}
                onChange={(e) => setPrinterName(e.target.value)}
                placeholder="e.g., Kitchen Printer"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Printer Type</label>
              <select
                value={printerType}
                onChange={(e) => setPrinterType(e.target.value as 'bill' | 'kitchen' | 'both')}
                className="w-full p-2 border rounded-md text-sm bg-background"
              >
                <option value="bill">Bill Printer</option>
                <option value="kitchen">Kitchen Printer</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Paper Size</label>
              <select
                value={printerPaperSize}
                onChange={(e) => setPrinterPaperSize(e.target.value as '58mm' | '80mm' | 'a4')}
                className="w-full p-2 border rounded-md text-sm bg-background"
              >
                <option value="58mm">58mm (Small)</option>
                <option value="80mm">80mm (Standard)</option>
                <option value="a4">A4 (Full Page)</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Set as Default</span>
              <Switch
                checked={printerIsDefault}
                onCheckedChange={setPrinterIsDefault}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <Switch
                checked={printerIsActive}
                onCheckedChange={setPrinterIsActive}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPrinterDialog(false)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePrinter}
              className="bg-primary hover:bg-primary/90 text-sm"
            >
              {editingPrinter ? 'Update' : 'Add'} Printer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

