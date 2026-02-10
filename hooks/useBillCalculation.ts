"use client";

import { useMemo, useState } from 'react';
import type { CartItem } from './useCart';

interface BillSettings {
  taxRate: number;
  serviceCharge: number;
}

export function useBillCalculation(cart: CartItem[], settings: BillSettings) {
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [billNote, setBillNote] = useState('');
  const [applyGST, setApplyGST] = useState(true);
  const [splitBillCount, setSplitBillCount] = useState(1);

  const calculations = useMemo(() => {
    const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = applyGST ? Math.round(subTotal * (settings.taxRate / 100)) : 0;
    const serviceChargeAmount = Math.round(subTotal * (settings.serviceCharge / 100));

    // Calculate discount
    let discount = 0;
    if (discountAmount && parseFloat(discountAmount) > 0) {
      discount = parseFloat(discountAmount);
    } else if (discountPercent && parseFloat(discountPercent) > 0) {
      discount = Math.round(subTotal * (parseFloat(discountPercent) / 100));
    }

    const total = subTotal + tax + serviceChargeAmount - discount;
    const splitAmount = splitBillCount > 1 ? Math.round(total / splitBillCount) : total;

    return {
      subTotal,
      tax,
      serviceCharge: serviceChargeAmount,
      discount,
      total,
      splitAmount,
      splitCount: splitBillCount,
    };
  }, [cart, settings, discountAmount, discountPercent, applyGST, splitBillCount]);

  const resetBillState = () => {
    setDiscountAmount('');
    setDiscountPercent('');
    setBillNote('');
    setApplyGST(true);
    setSplitBillCount(1);
  };

  return {
    ...calculations,
    discountAmount,
    setDiscountAmount,
    discountPercent,
    setDiscountPercent,
    billNote,
    setBillNote,
    applyGST,
    setApplyGST,
    splitBillCount,
    setSplitBillCount,
    resetBillState,
  };
}

