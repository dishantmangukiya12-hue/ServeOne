"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Package, Plus, Pencil, Trash2, AlertTriangle, TrendingDown, History } from 'lucide-react';
import type { InventoryItem } from '@/types/restaurant';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useInventory, useCreateInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem, useRestaurant, useUpdateRestaurant } from '@/hooks/api';

export default function Inventory() {
  const { restaurant } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  // Form states
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('');
  const [minThreshold, setMinThreshold] = useState('10');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [supplier, setSupplier] = useState('');

  const { data: inventoryData } = useInventory(restaurant?.id);
  const { data: restaurantData } = useRestaurant(restaurant?.id);
  const createItem = useCreateInventoryItem(restaurant?.id);
  const updateItem = useUpdateInventoryItem(restaurant?.id);
  const deleteItem = useDeleteInventoryItem(restaurant?.id);
  const updateRestaurant = useUpdateRestaurant(restaurant?.id);

  const items = inventoryData?.items || [];
  const settings = { enableInventory: restaurantData?.settings?.enableInventory ?? false };

  if (!restaurant) return null;

  const handleToggleInventory = (enabled: boolean) => {
    updateRestaurant.mutate(
      { settings: { enableInventory: enabled } },
      { onSuccess: () => toast.success(enabled ? 'Inventory tracking enabled' : 'Inventory tracking disabled') }
    );
  };

  const handleAddItem = () => {
    if (!name || !quantity) {
      toast.error('Please fill in required fields');
      return;
    }

    createItem.mutate(
      {
        restaurantId: restaurant.id,
        name,
        unit,
        quantity: parseFloat(quantity) || 0,
        minThreshold: parseFloat(minThreshold) || 10,
        costPerUnit: parseFloat(costPerUnit) || 0,
        supplier: supplier || undefined,
      },
      {
        onSuccess: () => {
          resetForm();
          setShowAddDialog(false);
        },
      }
    );
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    updateItem.mutate(
      {
        itemId: editingItem.id,
        name,
        unit,
        quantity: parseFloat(quantity) || 0,
        minThreshold: parseFloat(minThreshold) || 10,
        costPerUnit: parseFloat(costPerUnit) || 0,
        supplier: supplier || undefined,
        lastRestocked: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setEditingItem(null);
          setShowEditDialog(false);
          resetForm();
          toast.success('Inventory updated');
        },
      }
    );
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteItem.mutate(itemId);
    }
  };

  const handleRestock = (item: InventoryItem) => {
    const amount = prompt(`Enter quantity to add to ${item.name} (${item.unit}):`);
    if (amount && !isNaN(parseFloat(amount))) {
      updateItem.mutate(
        {
          itemId: item.id,
          quantity: item.quantity + parseFloat(amount),
          lastRestocked: new Date().toISOString(),
        },
        {
          onSuccess: () => toast.success(`Restocked ${amount} ${item.unit} of ${item.name}`),
        }
      );
    }
  };

  const resetForm = () => {
    setName('');
    setUnit('kg');
    setQuantity('');
    setMinThreshold('10');
    setCostPerUnit('');
    setSupplier('');
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setUnit(item.unit);
    setQuantity(item.quantity.toString());
    setMinThreshold(item.minThreshold.toString());
    setCostPerUnit(item.costPerUnit?.toString() || '');
    setSupplier(item.supplier || '');
    setShowEditDialog(true);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'low' ? item.quantity <= item.minThreshold && item.quantity > 0 :
      filter === 'out' ? item.quantity === 0 : true;
    return matchesSearch && matchesFilter;
  });

  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold && item.quantity > 0);
  const outOfStockItems = items.filter(item => item.quantity === 0);
  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.costPerUnit || 0)), 0);

  if (!settings.enableInventory) {
    return (
      <div className="min-h-screen bg-background">
        <main className="p-4 md:p-6 max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Inventory Tracking</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Enable inventory tracking to monitor stock levels, get low stock alerts, and automatically deduct ingredients when orders are placed.
            </p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-muted-foreground">Enable Inventory Tracking</span>
              <Switch
                checked={settings.enableInventory}
                onCheckedChange={handleToggleInventory}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6" />
              Inventory Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Track stock levels and manage supplies</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tracking</span>
              <Switch
                checked={settings.enableInventory}
                onCheckedChange={handleToggleInventory}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-muted-foreground text-xs">Total Items</div>
            <div className="text-2xl font-bold text-foreground">{items.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-muted-foreground text-xs">Stock Value</div>
            <div className="text-2xl font-bold text-foreground">₹{totalValue.toLocaleString()}</div>
          </Card>
          <Card className={`p-4 ${lowStockItems.length > 0 ? 'bg-warning/10 border-warning/20' : ''}`}>
            <div className={`text-xs ${lowStockItems.length > 0 ? 'text-warning' : 'text-muted-foreground'}`}>Low Stock</div>
            <div className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-warning' : 'text-foreground'}`}>
              {lowStockItems.length}
            </div>
          </Card>
          <Card className={`p-4 ${outOfStockItems.length > 0 ? 'bg-destructive/10 border-destructive/20' : ''}`}>
            <div className={`text-xs ${outOfStockItems.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>Out of Stock</div>
            <div className={`text-2xl font-bold ${outOfStockItems.length > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {outOfStockItems.length}
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card text-foreground"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'low', 'out'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {f === 'all' ? 'All Items' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Item</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Unit Cost</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Value</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isLow = item.quantity <= item.minThreshold && item.quantity > 0;
                    const isOut = item.quantity === 0;
                    const value = item.quantity * (item.costPerUnit || 0);

                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium text-foreground">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.supplier || 'No supplier'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{item.quantity} {item.unit}</div>
                          <div className="text-xs text-muted-foreground">Min: {item.minThreshold} {item.unit}</div>
                        </td>
                        <td className="p-4">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded-full text-xs font-medium">
                              <TrendingDown className="h-3 w-3" />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">₹{item.costPerUnit || 0}</td>
                        <td className="p-4 font-medium">₹{value.toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRestock(item)}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                              title="Restock"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditDialog(item)}
                              className="p-2 text-info hover:bg-info/10 rounded-lg"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No inventory items found</p>
                      <p className="text-sm">Add items to start tracking</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Item Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Item Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tomatoes" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 mt-1 bg-card text-foreground"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pcs">Pieces</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Current Quantity *</label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Min Threshold</label>
                  <Input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cost per Unit (₹)</label>
                  <Input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Supplier (Optional)</label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Supplier name" />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddItem}>
                  Add Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Item Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-border rounded-lg p-2 mt-1 bg-card text-foreground"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (L)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="pcs">Pieces</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Current Quantity</label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Min Threshold</label>
                  <Input
                    type="number"
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cost per Unit (₹)</label>
                  <Input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Supplier</label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleUpdateItem}>
                  Update
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

