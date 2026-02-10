"use client";

import { useState, useEffect, useCallback } from 'react';
import type { MenuItem, Table, Order, Restaurant } from '@/services/dataService';
import { getRestaurantData } from '@/services/dataService';
import { getPendingQROrderCount } from '@/components/QROrderManager';
import { useDataRefresh } from '@/hooks/useServerSync';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Settings {
  taxRate: number;
  serviceCharge: number;
}

export function useOrdersData(restaurant: Restaurant | null) {
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<Settings>({ taxRate: 5, serviceCharge: 0 });
  const [pendingQRCount, setPendingQRCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadData = useCallback(() => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setTables(data.tables);
      setMenuItems(data.menuItems);
      setCategories(data.categories);
      if (data.settings) {
        setSettings({
          taxRate: data.settings.taxRate ?? 5,
          serviceCharge: data.settings.serviceCharge ?? 0,
        });
      }
      if (data.categories.length > 0 && !selectedCategory) {
        setSelectedCategory(data.categories[0].id);
      }
    }
  }, [restaurant, selectedCategory]);

  // Load data on mount and when restaurant changes
  useEffect(() => {
    if (!restaurant) return;
    loadData();
  }, [restaurant?.id, loadData]);

  // Re-load when server sync updates localStorage
  useDataRefresh(loadData);

  // Check for pending QR orders
  useEffect(() => {
    if (!restaurant) return;

    const checkPending = () => {
      setPendingQRCount(getPendingQROrderCount(restaurant.id));
    };

    checkPending();
    const interval = setInterval(checkPending, 3000);

    const handleStorage = () => checkPending();
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [restaurant?.id]);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const getOrderForTable = useCallback((table: Table): Order | null => {
    if (!table.currentOrderId || !restaurant) return null;
    const data = getRestaurantData(restaurant.id);
    if (!data) return null;
    return data.orders.find(o => o.id === table.currentOrderId) || null;
  }, [restaurant]);

  return {
    tables,
    setTables,
    menuItems,
    categories,
    settings,
    pendingQRCount,
    selectedCategory,
    setSelectedCategory,
    refreshData,
    getOrderForTable,
  };
}

