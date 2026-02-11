"use client";

import { useState, useMemo } from 'react';
import type { MenuItem, Table, Order, Restaurant } from '@/types/restaurant';
import { useTables } from '@/hooks/api/useTables';
import { useMenuItems, useCategories } from '@/hooks/api/useMenuItems';
import { useRestaurant } from '@/hooks/api/useRestaurant';
import { useOrders } from '@/hooks/api/useOrders';
import { useQROrders } from '@/hooks/api/useQROrders';

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
  const restaurantId = restaurant?.id;
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: tablesData } = useTables(restaurantId);
  const { data: menuData } = useMenuItems(restaurantId);
  const { data: catData } = useCategories(restaurantId);
  const { data: restData } = useRestaurant(restaurantId);
  const { data: ordersData } = useOrders(restaurantId, { status: 'active' });
  const { data: qrData } = useQROrders(restaurantId);

  const tables = useMemo(() => (tablesData?.tables || []) as Table[], [tablesData]);
  const menuItems = useMemo(() => (menuData?.items || []) as MenuItem[], [menuData]);
  const categories = useMemo(() => (catData?.categories || []) as Category[], [catData]);
  const allOrders = useMemo(() => (ordersData?.orders || []) as Order[], [ordersData]);

  const settings = useMemo<Settings>(() => {
    const s = restData?.settings as unknown as Record<string, unknown> | null;
    return {
      taxRate: (s?.taxRate as number) ?? 5,
      serviceCharge: (s?.serviceCharge as number) ?? 0,
    };
  }, [restData]);

  const pendingQRCount = useMemo(() => {
    return (qrData?.orders || []).filter(o => o.status === 'pending_approval').length;
  }, [qrData]);

  const refreshData = () => {
    // No-op — React Query handles refetching
  };

  const getOrderForTable = (table: Table): Order | null => {
    return allOrders.find(o => o.tableId === table.id && o.status === 'active') || null;
  };

  return {
    tables,
    setTables: () => {},
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
