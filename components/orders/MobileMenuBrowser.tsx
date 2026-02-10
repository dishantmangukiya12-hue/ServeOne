"use client";

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, ArrowLeft, AlertTriangle } from 'lucide-react';
import type { MenuItem } from '@/services/dataService';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface MobileMenuBrowserProps {
  categories: Category[];
  menuItems: MenuItem[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  cart: { menuItemId: string; quantity: number }[];
  total: number;
  tableNumber: string;
  hasExistingOrder?: boolean;
  onAddToCart: (item: MenuItem) => void;
  enableInventory?: boolean;
  onBack: () => void;
  onShowCustomItem: () => void;
  onViewCart: () => void;
  onClearCart: () => void;
}

export function MobileMenuBrowser({
  categories,
  menuItems,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  cart,
  total,
  tableNumber,
  onAddToCart,
  enableInventory,
  onBack,
  onShowCustomItem,
  onViewCart,
  onClearCart,
}: MobileMenuBrowserProps) {
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery ? matchesSearch : matchesCategory;
  });

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="bg-card p-3 border-b flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-primary text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-sm font-medium">Table {tableNumber}</span>
        <div className="w-16"></div>
      </div>

      {/* Category Pills - Horizontal Scroll */}
      <div className="bg-card border-b p-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchQuery('');
              }}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="p-3 bg-card border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search items... (Press / to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
        </div>
      </div>

      {/* Menu Items - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isOutOfStock = enableInventory && (item.available === false || (item.stockQuantity !== undefined && item.stockQuantity !== null && item.stockQuantity <= 0));
              const isLowStock = enableInventory && !isOutOfStock && item.stockQuantity !== undefined && item.stockQuantity !== null && item.lowStockThreshold && item.stockQuantity <= item.lowStockThreshold;
              return (
                <Card key={item.id} className={`p-3 transition-shadow ${isOutOfStock ? 'opacity-50' : 'hover:shadow-md'}`}>
                  <div className="flex items-start gap-1.5 mb-2">
                    <span className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${item.isVeg ? 'bg-primary' : 'bg-destructive'}`} />
                    <span className="font-medium text-xs leading-tight">{item.name}</span>
                  </div>
                  {enableInventory && isOutOfStock && (
                    <div className="text-[10px] text-destructive font-medium mb-1 flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" /> Out of stock
                    </div>
                  )}
                  {isLowStock && (
                    <div className="text-[10px] text-amber-600 font-medium mb-1 flex items-center gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" /> Only {item.stockQuantity} left
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-muted-foreground text-sm font-medium">₹{item.price}</span>
                    {isOutOfStock ? (
                      <span className="w-7 h-7 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                        <Plus className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <button
                        onClick={() => onAddToCart(item)}
                        className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🍽️</div>
              <p className="text-sm">No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Summary - Fixed Bottom */}
      <div className="bg-card border-t p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onShowCustomItem}
            className="text-primary text-sm font-medium flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Custom Item
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{itemCount} items</span>
            <span className="text-primary font-bold">₹{total}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="flex-1 px-3 py-2 text-destructive border border-destructive/20 rounded-lg text-sm font-medium"
            >
              Clear
            </button>
          )}
          <button
            onClick={onViewCart}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
          >
            View Cart
          </button>
        </div>
      </div>
    </div>
  );
}

