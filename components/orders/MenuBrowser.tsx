"use client";

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import type { MenuItem } from '@/services/dataService';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface MenuBrowserProps {
  categories: Category[];
  menuItems: MenuItem[];
  selectedCategory: string;
  setSelectedCategory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  onAddToCart: (item: MenuItem) => void;
  enableInventory?: boolean;
}

export function MenuBrowser({
  categories,
  menuItems,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  onAddToCart,
  enableInventory,
}: MenuBrowserProps) {
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return searchQuery ? matchesSearch : matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search Items (Press / to focus)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-48 border-r bg-card overflow-y-auto flex-shrink-0">
          <div className="space-y-1 p-2">
            {categories.length > 0 ? (
              categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {cat.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                No categories added
              </div>
            )}
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isOutOfStock = enableInventory && (item.available === false || (item.stockQuantity !== undefined && item.stockQuantity !== null && item.stockQuantity <= 0));
                const isLowStock = enableInventory && !isOutOfStock && item.stockQuantity !== undefined && item.stockQuantity !== null && item.lowStockThreshold && item.stockQuantity <= item.lowStockThreshold;
                return (
                  <Card
                    key={item.id}
                    className={`p-4 transition-shadow ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
                    onClick={() => !isOutOfStock && onAddToCart(item)}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full mt-1 ${item.isVeg ? 'bg-primary' : 'bg-destructive'}`} />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {enableInventory && isOutOfStock && (
                      <div className="text-xs text-destructive font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Out of stock
                      </div>
                    )}
                    {isLowStock && (
                      <div className="text-xs text-amber-600 font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Only {item.stockQuantity} left
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">₹ {item.price}</span>
                      {isOutOfStock ? (
                        <span className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center">
                          <Plus className="h-4 w-4" />
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(item);
                          }}
                          className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-2 xl:col-span-3 2xl:col-span-4 text-center py-12 text-muted-foreground">
                <div className="text-6xl mb-4">🍽️</div>
                <p>No menu items available</p>
                <p className="text-sm">Add items in the Menu section</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

