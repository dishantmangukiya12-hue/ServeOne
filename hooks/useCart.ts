"use client";

import { useState, useCallback } from 'react';
import type { MenuItem } from '@/types/restaurant';
import { toast } from 'sonner';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequest: string;
  addedAt?: string;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');

  const addToCart = useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        specialRequest: '',
        addedAt: new Date().toISOString()
      }];
    });
  }, []);

  const addCustomItemToCart = useCallback(() => {
    if (!customItemName.trim() || !customItemPrice.trim()) {
      toast.error('Please enter both item name and price');
      return false;
    }
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return false;
    }

    const customId = `custom_${Date.now()}`;
    setCart(prev => [...prev, {
      menuItemId: customId,
      name: customItemName.trim(),
      price: price,
      quantity: 1,
      specialRequest: '',
      addedAt: new Date().toISOString()
    }]);

    const itemName = customItemName.trim();
    setCustomItemName('');
    setCustomItemPrice('');
    toast.success(`Added "${itemName}" to order`);
    return true;
  }, [customItemName, customItemPrice]);

  const updateQuantity = useCallback((menuItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
  }, []);

  const updateSpecialRequest = useCallback((menuItemId: string, request: string) => {
    setCart(prev => prev.map(item =>
      item.menuItemId === menuItemId ? { ...item, specialRequest: request } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const setCartItems = useCallback((items: CartItem[]) => {
    setCart(items);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    setCart: setCartItems,
    cartTotal,
    itemCount,
    addToCart,
    addCustomItemToCart,
    updateQuantity,
    removeFromCart,
    updateSpecialRequest,
    clearCart,
    customItemName,
    setCustomItemName,
    customItemPrice,
    setCustomItemPrice,
  };
}

