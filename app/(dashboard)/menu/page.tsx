"use client";

import { PageLoading } from '@/components/PageLoading';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuItems, useCategories, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useCreateCategory, useInventory, useRestaurant, useUpdateRestaurant } from '@/hooks/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Settings, Sliders, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Category, MenuItem, ModifierGroup, InventoryItem } from '@/types/restaurant';
import { ModifierConfigDialog } from '@/components/menu/ModifierConfigDialog';

interface LocalSettings {
  taxRate: number;
  serviceCharge: number;
}

export default function Menu() {
  const { restaurant } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showModifierDialog, setShowModifierDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('🍽️');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [taxRate, setTaxRate] = useState('5');
  const [serviceCharge, setServiceCharge] = useState('0');
  // Inventory states
  const [itemStockQuantity, setItemStockQuantity] = useState('');
  const [itemLowStockThreshold, setItemLowStockThreshold] = useState('10');
  const [recipeIngredients, setRecipeIngredients] = useState<{inventoryItemId: string; quantity: number; name?: string}[]>([]);

  const { data: menuItemsData } = useMenuItems(restaurant?.id);
  const { data: categoriesData } = useCategories(restaurant?.id);
  const { data: inventoryData } = useInventory(restaurant?.id);
  const { data: restaurantData } = useRestaurant(restaurant?.id);
  const createMenuItem = useCreateMenuItem(restaurant?.id);
  const updateMenuItemMutation = useUpdateMenuItem(restaurant?.id);
  const deleteMenuItemMutation = useDeleteMenuItem(restaurant?.id);
  const createCategory = useCreateCategory(restaurant?.id);
  const updateRestaurant = useUpdateRestaurant(restaurant?.id);

  const categories = categoriesData?.categories || [];
  const menuItems = menuItemsData?.items || [];
  const inventory = inventoryData?.items || [];
  const settings: LocalSettings = {
    taxRate: restaurantData?.settings?.taxRate ?? 5,
    serviceCharge: restaurantData?.settings?.serviceCharge ?? 0,
  };

  // Set initial selected category
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Sync tax settings
  useEffect(() => {
    if (restaurantData?.settings) {
      setTaxRate((restaurantData.settings.taxRate ?? 5).toString());
      setServiceCharge((restaurantData.settings.serviceCharge ?? 0).toString());
    }
  }, [restaurantData?.settings]);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleAddCategory = () => {
    if (!categoryName) {
      toast.error('Please enter a category name');
      return;
    }
    if (!restaurant) return;

    createCategory.mutate(
      {
        restaurantId: restaurant.id,
        name: categoryName,
        icon: categoryIcon,
        sortingOrder: categories.length + 1,
      },
      {
        onSuccess: () => {
          setCategoryName('');
          setShowAddCategoryDialog(false);
        },
      }
    );
  };

  const handleAddItem = () => {
    if (!itemName) {
      toast.error('Please enter an item name');
      return;
    }
    if (!itemPrice) {
      toast.error('Please enter a price');
      return;
    }
    if (!itemCategory) {
      toast.error('Please select a category');
      return;
    }
    if (!restaurant) return;

    createMenuItem.mutate(
      {
        restaurantId: restaurant.id,
        name: itemName,
        price: parseFloat(itemPrice) || 0,
        category: itemCategory,
        isVeg: itemIsVeg,
        dineIn: true,
        takeAway: true,
        homeDelivery: true,
        aggregators: true,
        stockQuantity: itemStockQuantity ? parseInt(itemStockQuantity) : undefined,
        lowStockThreshold: itemLowStockThreshold ? parseInt(itemLowStockThreshold) : 10,
        available: true,
      },
      {
        onSuccess: () => {
          resetItemForm();
          setShowAddItemDialog(false);
        },
      }
    );
  };

  const resetItemForm = () => {
    setItemName('');
    setItemPrice('');
    setItemCategory('');
    setItemIsVeg(true);
    setItemStockQuantity('');
    setItemLowStockThreshold('10');
    setRecipeIngredients([]);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !restaurant) return;

    updateMenuItemMutation.mutate(
      {
        itemId: editingItem.id,
        name: itemName,
        price: parseFloat(itemPrice) || 0,
        category: itemCategory,
        isVeg: itemIsVeg,
        stockQuantity: itemStockQuantity ? parseInt(itemStockQuantity) : undefined,
        lowStockThreshold: itemLowStockThreshold ? parseInt(itemLowStockThreshold) : 10,
      },
      {
        onSuccess: () => {
          setEditingItem(null);
          resetItemForm();
          setShowAddItemDialog(false);
        },
      }
    );
  };

  const handleDeleteItem = (itemId: string) => {
    if (!restaurant) return;
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMenuItemMutation.mutate(itemId);
    }
  };

  const handleSaveSettings = () => {
    if (!restaurant) return;
    updateRestaurant.mutate(
      {
        settings: {
          taxRate: parseFloat(taxRate) || 0,
          serviceCharge: parseFloat(serviceCharge) || 0,
        },
      },
      {
        onSuccess: () => setShowSettingsDialog(false),
      }
    );
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemCategory(item.category);
    setItemIsVeg(item.isVeg);
    // Populate inventory fields
    setItemStockQuantity(item.stockQuantity?.toString() || '');
    setItemLowStockThreshold(item.lowStockThreshold?.toString() || '10');
    setRecipeIngredients(item.recipeIngredients || []);
    setShowAddItemDialog(true);
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemCategory(selectedCategory);
    setItemIsVeg(true);
    // Reset inventory fields
    setItemStockQuantity('');
    setItemLowStockThreshold('10');
    setRecipeIngredients([]);
    setShowAddItemDialog(true);
  };

  const toggleItemChannel = (item: MenuItem, channel: keyof MenuItem) => {
    if (!restaurant) return;
    updateMenuItemMutation.mutate({
      itemId: item.id,
      [channel]: !item[channel],
    });
  };

  const openModifierConfig = (item: MenuItem) => {
    setModifierItem(item);
    setShowModifierDialog(true);
  };

  const handleSaveModifiers = (modifiers: ModifierGroup[]) => {
    if (!restaurant || !modifierItem) return;
    updateMenuItemMutation.mutate({ itemId: modifierItem.id, modifiers: modifiers as unknown as Record<string, unknown>[] });
  };

  // Recipe ingredient handlers
  const addIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { inventoryItemId: '', quantity: 1 }]);
  };

  const removeIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: 'inventoryItemId' | 'quantity', value: string | number) => {
    const updated = [...recipeIngredients];
    if (field === 'inventoryItemId') {
      const item = inventory.find(i => i.id === value);
      updated[index] = { ...updated[index], inventoryItemId: value as string, name: item?.name };
    } else {
      updated[index] = { ...updated[index], quantity: value as number };
    }
    setRecipeIngredients(updated);
  };

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category === selectedCategory)
    : menuItems;
  const selectedCategoryName = selectedCategory
    ? (categories.find(c => c.id === selectedCategory)?.name || 'Select Category')
    : 'All Items';

  if (!restaurant) {
    return <PageLoading message="Loading menu..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        {/* Mobile Category Selector */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-foreground text-sm">Category</h3>
            <button
              onClick={() => setShowAddCategoryDialog(true)}
              className="text-primary hover:bg-primary/10 p-1.5 rounded"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left Sidebar - Categories - Desktop Only */}
          <div className="hidden lg:block w-64 bg-card rounded-lg shadow-sm">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium text-foreground">Categories</h3>
              <button
                onClick={() => setShowAddCategoryDialog(true)}
                className="text-primary hover:bg-primary/10 p-1 rounded"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted ${
                      selectedCategory === cat.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm text-foreground">{cat.name}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-sm">No categories added</p>
                  <p className="text-xs mt-1">Click + to add a category</p>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  setTaxRate(settings.taxRate.toString());
                  setServiceCharge(settings.serviceCharge.toString());
                  setShowSettingsDialog(true);
                }}
                className="flex items-center gap-2 text-primary text-sm font-medium w-full"
              >
                <Settings className="h-4 w-4" />
                Menu Settings
              </button>
              <div className="mt-2 text-xs text-muted-foreground">
                Tax: {settings.taxRate}% | Service: {settings.serviceCharge}%
              </div>
            </div>
          </div>

          {/* Right Content - Menu Items */}
          <div className="flex-1">
            <Card className="overflow-hidden">
              <div className="p-3 md:p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-border"
                  />
                  <span className="font-medium text-foreground text-sm">{selectedCategoryName}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openAddItem}
                    className="text-primary text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    ADD ITEM
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 md:p-3 w-8 md:w-10">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="rounded border-border"
                        />
                      </th>
                      <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Item</th>
                      <th className="p-2 md:p-3 text-left text-xs md:text-sm font-medium text-muted-foreground">Price</th>
                      <th className="p-2 md:p-3 text-center text-xs md:text-sm font-medium text-muted-foreground">DineIn</th>
                      <th className="p-2 md:p-3 text-center text-xs md:text-sm font-medium text-muted-foreground">Take</th>
                      <th className="hidden sm:table-cell p-2 md:p-3 text-center text-xs md:text-sm font-medium text-muted-foreground">Del</th>
                      <th className="hidden sm:table-cell p-2 md:p-3 text-center text-xs md:text-sm font-medium text-muted-foreground">Agg</th>
                      <th className="p-2 md:p-3 w-8 md:w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted">
                          <td className="p-2 md:p-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleSelectItem(item.id)}
                              className="rounded border-border"
                            />
                          </td>
                          <td className="p-2 md:p-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <span className="font-medium text-xs md:text-sm truncate max-w-[100px] md:max-w-[150px] block">{item.name}</span>
                                {item.recipeIngredients && item.recipeIngredients.length > 0 && (
                                  <span className="text-[10px] text-info">{item.recipeIngredients.length} ingredient{item.recipeIngredients.length > 1 ? 's' : ''}</span>
                                )}
                                {item.modifiers && item.modifiers.length > 0 && (
                                  <span className="text-[10px] text-primary">{item.modifiers.length} modifier{item.modifiers.length > 1 ? 's' : ''}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 md:p-3 text-xs md:text-sm">₹{item.price}</td>
                          <td className="p-2 md:p-3 text-center">
                            <Switch
                              checked={item.dineIn}
                              onCheckedChange={() => toggleItemChannel(item, 'dineIn')}
                              className="data-[state=checked]:bg-primary scale-75 md:scale-100"
                            />
                          </td>
                          <td className="p-2 md:p-3 text-center">
                            <Switch
                              checked={item.takeAway}
                              onCheckedChange={() => toggleItemChannel(item, 'takeAway')}
                              className="data-[state=checked]:bg-primary scale-75 md:scale-100"
                            />
                          </td>
                          <td className="hidden sm:table-cell p-2 md:p-3 text-center">
                            <Switch
                              checked={item.homeDelivery}
                              onCheckedChange={() => toggleItemChannel(item, 'homeDelivery')}
                              className="data-[state=checked]:bg-primary scale-75 md:scale-100"
                            />
                          </td>
                          <td className="hidden sm:table-cell p-2 md:p-3 text-center">
                            <Switch
                              checked={item.aggregators}
                              onCheckedChange={() => toggleItemChannel(item, 'aggregators')}
                              className="data-[state=checked]:bg-primary scale-75 md:scale-100"
                            />
                          </td>
                          <td className="p-2 md:p-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => openModifierConfig(item)}
                                className="text-primary hover:bg-primary/10 p-1 rounded"
                                title="Configure modifiers"
                              >
                                <Sliders className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </button>
                              <button
                                onClick={() => openEditItem(item)}
                                className="text-primary hover:bg-primary/10 p-1 rounded"
                              >
                                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-destructive hover:bg-destructive/10 p-1 rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-8 text-center text-muted-foreground" colSpan={8}>
                          <div className="text-4xl md:text-6xl mb-4">🍽️</div>
                          <p className="text-sm">No menu items in this category</p>
                          <p className="text-xs mt-1">Click &quot;ADD ITEM&quot; to add items</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Category Name</label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Icon</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
              >
                <option value="🍽️">🍽️ Food</option>
                <option value="🍜">🍜 Noodles</option>
                <option value="🍣">🍣 Sushi</option>
                <option value="🥤">🥤 Drinks</option>
                <option value="☕">☕ Coffee</option>
                <option value="🍧">🍧 Dessert</option>
                <option value="🍫">🍫 Chocolate</option>
                <option value="🍪">🍪 Biscuit</option>
                <option value="🍨">🍨 Ice Cream</option>
                <option value="➕">➕ Add On</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddCategoryDialog(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleAddCategory}
                disabled={!categoryName}
              >
                ADD
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Item Name</label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Price (₹)</label>
              <Input
                type="number"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                placeholder="Enter price"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVeg"
                checked={itemIsVeg}
                onChange={(e) => setItemIsVeg(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isVeg" className="text-sm">Vegetarian</label>
            </div>

            {/* Inventory Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" /> Inventory Management (Optional)
              </h4>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground">Stock Quantity</label>
                  <Input
                    type="number"
                    min="0"
                    value={itemStockQuantity}
                    onChange={(e) => setItemStockQuantity(e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Low Stock Alert (units)</label>
                  <Input
                    type="number"
                    min="0"
                    value={itemLowStockThreshold}
                    onChange={(e) => setItemLowStockThreshold(e.target.value)}
                    placeholder="e.g., 10"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Alert when stock falls to or below this</p>
                </div>
              </div>

              {/* Recipe Ingredients Section */}
              <div className="bg-muted/50 p-3 rounded-lg mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Recipe Ingredients</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Ingredient
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Select inventory items and quantities consumed when this item is ordered
                </p>
                
                {recipeIngredients.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No ingredients added yet</p>
                )}

                {recipeIngredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <select
                      className="flex-1 border rounded-lg p-2 text-sm"
                      value={ingredient.inventoryItemId}
                      onChange={(e) => updateIngredient(index, 'inventoryItemId', e.target.value)}
                    >
                      <option value="">Select inventory item...</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                      ))}
                    </select>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      className="w-20"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                    <button
                      onClick={() => removeIngredient(index)}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddItemDialog(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={editingItem ? handleUpdateItem : handleAddItem}
                disabled={!itemName || !itemPrice || !itemCategory}
              >
                {editingItem ? 'UPDATE' : 'ADD'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Menu Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Tax Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="Enter tax rate (0 for no tax)"
              />
              <p className="text-xs text-muted-foreground mt-1">Set to 0 if you don't charge tax</p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Service Charge (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                placeholder="Enter service charge"
              />
              <p className="text-xs text-muted-foreground mt-1">Set to 0 if you don't charge service fee</p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-xs text-muted-foreground">
                For an order of ₹100: Tax = ₹{((parseFloat(taxRate) || 0)).toFixed(2)},
                Service = ₹{((parseFloat(serviceCharge) || 0)).toFixed(2)},
                Total = ₹{(100 + (parseFloat(taxRate) || 0) + (parseFloat(serviceCharge) || 0)).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSettingsDialog(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSaveSettings}
              >
                SAVE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modifier Config Dialog */}
      <ModifierConfigDialog
        open={showModifierDialog}
        onClose={() => {
          setShowModifierDialog(false);
          setModifierItem(null);
        }}
        item={modifierItem}
        onSave={handleSaveModifiers}
      />
    </div>
  );
}

