"use client";

import { useState, useCallback } from 'react';
import type { Table } from '@/services/dataService';

export interface DialogState {
  customer: boolean;
  tableMenu: Table | null;
  cancel: boolean;
  close: boolean;
  closeSummary: boolean;
  bill: boolean;
  orderItems: boolean;
  kot: boolean;
  sendBill: boolean;
  qr: boolean;
  customerInfo: boolean;
  mobileCart: boolean;
  customItem: boolean;
  changeTable: boolean;
  qrOrders: boolean;
  qrDetail: boolean;
}

export function useOrderDialogs() {
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState<Table | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCloseSummary, setShowCloseSummary] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showOrderItemsDialog, setShowOrderItemsDialog] = useState(false);
  const [showKOTDialog, setShowKOTDialog] = useState(false);
  const [showSendBillDialog, setShowSendBillDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showCustomerInfoDialog, setShowCustomerInfoDialog] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false);
  const [showChangeTableDialog, setShowChangeTableDialog] = useState(false);
  const [showQROrdersDialog, setShowQROrdersDialog] = useState(false);
  const [showQRDetailDialog, setShowQRDetailDialog] = useState(false);

  const openDialog = useCallback((dialog: keyof DialogState) => {
    switch (dialog) {
      case 'customer': setShowCustomerDialog(true); break;
      case 'cancel': setShowCancelDialog(true); break;
      case 'close': setShowCloseDialog(true); break;
      case 'closeSummary': setShowCloseSummary(true); break;
      case 'bill': setShowBillDialog(true); break;
      case 'orderItems': setShowOrderItemsDialog(true); break;
      case 'kot': setShowKOTDialog(true); break;
      case 'sendBill': setShowSendBillDialog(true); break;
      case 'qr': setShowQRDialog(true); break;
      case 'customerInfo': setShowCustomerInfoDialog(true); break;
      case 'mobileCart': setShowMobileCart(true); break;
      case 'customItem': setShowCustomItemDialog(true); break;
      case 'changeTable': setShowChangeTableDialog(true); break;
      case 'qrOrders': setShowQROrdersDialog(true); break;
      case 'qrDetail': setShowQRDetailDialog(true); break;
    }
  }, []);

  const closeDialog = useCallback((dialog: keyof DialogState) => {
    switch (dialog) {
      case 'customer': setShowCustomerDialog(false); break;
      case 'tableMenu': setShowTableMenu(null); break;
      case 'cancel': setShowCancelDialog(false); break;
      case 'close': setShowCloseDialog(false); break;
      case 'closeSummary': setShowCloseSummary(false); break;
      case 'bill': setShowBillDialog(false); break;
      case 'orderItems': setShowOrderItemsDialog(false); break;
      case 'kot': setShowKOTDialog(false); break;
      case 'sendBill': setShowSendBillDialog(false); break;
      case 'qr': setShowQRDialog(false); break;
      case 'customerInfo': setShowCustomerInfoDialog(false); break;
      case 'mobileCart': setShowMobileCart(false); break;
      case 'customItem': setShowCustomItemDialog(false); break;
      case 'changeTable': setShowChangeTableDialog(false); break;
      case 'qrOrders': setShowQROrdersDialog(false); break;
      case 'qrDetail': setShowQRDetailDialog(false); break;
    }
  }, []);

  const closeAllDialogs = useCallback(() => {
    setShowCustomerDialog(false);
    setShowTableMenu(null);
    setShowCancelDialog(false);
    setShowCloseDialog(false);
    setShowCloseSummary(false);
    setShowBillDialog(false);
    setShowOrderItemsDialog(false);
    setShowKOTDialog(false);
    setShowSendBillDialog(false);
    setShowQRDialog(false);
    setShowCustomerInfoDialog(false);
    setShowMobileCart(false);
    setShowCustomItemDialog(false);
    setShowChangeTableDialog(false);
    setShowQROrdersDialog(false);
    setShowQRDetailDialog(false);
  }, []);

  return {
    // Individual states for components that need direct access
    showCustomerDialog,
    setShowCustomerDialog,
    showTableMenu,
    setShowTableMenu,
    showCancelDialog,
    setShowCancelDialog,
    showCloseDialog,
    setShowCloseDialog,
    showCloseSummary,
    setShowCloseSummary,
    showBillDialog,
    setShowBillDialog,
    showOrderItemsDialog,
    setShowOrderItemsDialog,
    showKOTDialog,
    setShowKOTDialog,
    showSendBillDialog,
    setShowSendBillDialog,
    showQRDialog,
    setShowQRDialog,
    showCustomerInfoDialog,
    setShowCustomerInfoDialog,
    showMobileCart,
    setShowMobileCart,
    showCustomItemDialog,
    setShowCustomItemDialog,
    showChangeTableDialog,
    setShowChangeTableDialog,
    showQROrdersDialog,
    setShowQROrdersDialog,
    showQRDetailDialog,
    setShowQRDetailDialog,
    // Utility functions
    openDialog,
    closeDialog,
    closeAllDialogs,
  };
}

