"use client";

import type { Order } from '@/services/dataService';

interface BillPrintProps {
  order: Order | null;
  restaurantName: string;
  tableNumber: string | undefined;
  paymentMethod: string;
  customerName: string;
  customerMobile: string;
  receiptSettings?: {
    header: string;
    footer: string;
    gstNumber: string;
    showGstNumber: boolean;
  };
  taxSettings?: {
    cgst: number;
    sgst: number;
    serviceCharge: number;
  };
  restaurantAddress?: string;
}

export function BillPrint({
  order,
  restaurantName,
  tableNumber,
  paymentMethod,
  customerName,
  customerMobile,
  receiptSettings,
  taxSettings,
  restaurantAddress,
}: BillPrintProps) {
  if (!order) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹ ${amount.toFixed(2)}`;
  };

  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        maxWidth: '300px',
        margin: '0 auto',
        padding: '16px',
        fontSize: '12px',
        lineHeight: 1.4,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {receiptSettings?.header ? (
          <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>{receiptSettings.header}</p>
        ) : null}
        <h1
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '4px',
            textTransform: 'uppercase',
          }}
        >
          {restaurantName}
        </h1>
        {restaurantAddress && (
          <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>{restaurantAddress}</p>
        )}
        {receiptSettings?.showGstNumber && receiptSettings.gstNumber && (
          <p style={{ margin: '2px 0', fontSize: '10px', color: '#666' }}>
            GSTIN: {receiptSettings.gstNumber}
          </p>
        )}
        <p style={{ margin: '2px 0', color: '#666' }}>Bill Receipt</p>
        <p style={{ margin: '2px 0', fontSize: '11px' }}>
          {formatDate(order.createdAt)}
        </p>
      </div>

      {/* Order Info */}
      <div
        style={{
          borderBottom: '1px dashed #ccc',
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        <p style={{ margin: '2px 0' }}>
          <strong>Order #:</strong> {order.orderNumber}
        </p>
        {tableNumber && (
          <p style={{ margin: '2px 0' }}>
            <strong>Table:</strong> {tableNumber}
          </p>
        )}
        <p style={{ margin: '2px 0' }}>
          <strong>Waiter:</strong> {order.waiterName}
        </p>
        {customerName && (
          <p style={{ margin: '2px 0' }}>
            <strong>Customer:</strong> {customerName}
          </p>
        )}
        {customerMobile && (
          <p style={{ margin: '2px 0' }}>
            <strong>Mobile:</strong> {customerMobile}
          </p>
        )}
      </div>

      {/* Items */}
      <div
        style={{
          borderBottom: '1px dashed #ccc',
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        <table style={{ width: '100%', fontSize: '11px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>
              <th style={{ textAlign: 'center', padding: '2px 0' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '2px 0' }}>Price</th>
              <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '2px 0' }}>{item.name}</td>
                <td style={{ textAlign: 'center', padding: '2px 0' }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: 'right', padding: '2px 0' }}>
                  {formatCurrency(item.price)}
                </td>
                <td style={{ textAlign: 'right', padding: '2px 0' }}>
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div
        style={{
          borderBottom: '1px dashed #ccc',
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <span>Subtotal:</span>
          <span>{formatCurrency(order.subTotal)}</span>
        </div>
        {taxSettings && (taxSettings.cgst > 0 || taxSettings.sgst > 0) ? (
          <>
            {taxSettings.cgst > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span>CGST ({taxSettings.cgst}%):</span>
                <span>{formatCurrency(Math.round(order.subTotal * (taxSettings.cgst / 100)))}</span>
              </div>
            )}
            {taxSettings.sgst > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span>SGST ({taxSettings.sgst}%):</span>
                <span>{formatCurrency(Math.round(order.subTotal * (taxSettings.sgst / 100)))}</span>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>Tax:</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
        )}
        {order.discount > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>Discount:</span>
            <span>-{formatCurrency(order.discount)}</span>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '14px',
            marginTop: '8px',
            paddingTop: '4px',
            borderTop: '1px solid #ccc',
          }}
        >
          <span>Total:</span>
          <span>{formatCurrency(order.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div
        style={{
          borderBottom: '1px dashed #ccc',
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        <p style={{ margin: '2px 0' }}>
          <strong>Payment Method:</strong> {paymentMethod}
        </p>
        {order.partialPayments && order.partialPayments.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <p style={{ margin: '2px 0', fontWeight: 'bold' }}>Payment Details:</p>
            {order.partialPayments.map((payment, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  margin: '2px 0',
                }}
              >
                <span>{payment.method}:</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
        {receiptSettings?.footer ? (
          <p style={{ margin: '2px 0', fontSize: '10px' }}>{receiptSettings.footer}</p>
        ) : (
          <>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>
              Thank you for dining with us!
            </p>
            <p style={{ margin: '2px 0', fontSize: '10px' }}>
              Please visit again
            </p>
          </>
        )}
      </div>
    </div>
  );
}
