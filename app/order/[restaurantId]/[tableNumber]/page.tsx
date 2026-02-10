"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter
} from '@/components/ui/sheet';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Utensils, ShoppingCart, Plus, Minus, Trash2,
  CheckCircle, ChefHat, ArrowLeft, Store, Clock, Bell
} from 'lucide-react';
import { getRestaurantData, hydrateRestaurantData, type MenuItem, type Category } from '@/services/dataService';
import { toast } from 'sonner';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialRequest: string;
}

interface QROrder {
  id: string;
  restaurantId: string;
  tableId: string;
  tableNumber: string;
  customerName: string;
  customerMobile: string;
  items: CartItem[];
  total: number;
  status: 'pending_approval' | 'approved' | 'rejected';
  createdAt: string;
  channel: 'qr_ordering';
}

export default function CustomerOrder() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;
  const tableNumber = params.tableNumber as string;
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<'pending_approval' | 'approved' | 'rejected' | 'preparing' | 'ready' | 'served'>('pending_approval');

  // Fetch restaurant data
  useEffect(() => {
    if (!restaurantId) return;

    const loadData = async () => {
      let data = getRestaurantData(restaurantId);
      if (!data) {
        data = await hydrateRestaurantData(restaurantId);
      }
      if (data) {
        setRestaurant(data.restaurant);
        setCategories(data.categories);
        const dineInItems = data.menuItems.filter((item: MenuItem) =>
          item.available !== false && item.dineIn !== false
        );
        setMenuItems(dineInItems);
      }
      setIsLoading(false);
    };

    void loadData();
  }, [restaurantId]);

  // Get category name from ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  // Categories - use names instead of IDs
  const uniqueCategories = ['all', ...new Set(menuItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.menuItemId === item.id);
    
    if (existing) {
      setCart(cart.map(c => 
        c.menuItemId === item.id 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ));
    } else {
      setCart([...cart, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        specialRequest: ''
      }]);
    }
    
    toast.success(`Added ${item.name} to cart`);
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    const existing = cart.find(c => c.menuItemId === menuItemId);
    if (!existing) return;

    const newQuantity = existing.quantity + delta;
    
    if (newQuantity <= 0) {
      setCart(cart.filter(c => c.menuItemId !== menuItemId));
    } else {
      setCart(cart.map(c => 
        c.menuItemId === menuItemId 
          ? { ...c, quantity: newQuantity }
          : c
      ));
    }
  };

  const updateSpecialRequest = (menuItemId: string, request: string) => {
    setCart(cart.map(c => 
      c.menuItemId === menuItemId 
        ? { ...c, specialRequest: request }
        : c
    ));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter(c => c.menuItemId !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePlaceOrder = () => {
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!customerMobile.trim()) {
      toast.error('Please enter your mobile number');
      return;
    }

    const order: QROrder = {
      id: `qr_${Date.now()}`,
      restaurantId: restaurantId!,
      tableId: `table_${restaurantId}_${tableNumber}`,
      tableNumber: tableNumber!,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      items: cart.map(item => ({
        ...item,
        specialRequest: itemNotes[item.menuItemId] || item.specialRequest
      })),
      total: cartTotal,
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
      channel: 'qr_ordering'
    };

    // Store in pending QR orders
    const existingOrders = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
    localStorage.setItem('pending_qr_orders', JSON.stringify([...existingOrders, order]));

    // Notify manager tab (broadcast event)
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'pending_qr_orders'
    }));

    setShowCheckout(false);
    setCart([]);
    setItemNotes({});
    
    // Show status tracking
    setSubmittedOrderId(order.id);
    setOrderStatus('pending_approval');
    setShowSuccess(true);
  };

  // Poll for order status updates
  const checkOrderStatus = useCallback(() => {
    if (!submittedOrderId) return;
    const pendingOrders = JSON.parse(localStorage.getItem('pending_qr_orders') || '[]');
    const order = pendingOrders.find((o: QROrder) => o.id === submittedOrderId);
    if (order) {
      setOrderStatus(order.status);
    }
  }, [submittedOrderId]);

  useEffect(() => {
    if (!submittedOrderId) return;
    checkOrderStatus();
    const interval = setInterval(checkOrderStatus, 3000);
    const handleStorage = () => checkOrderStatus();
    window.addEventListener('storage', handleStorage);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [submittedOrderId, checkOrderStatus]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted px-4">
        <Store className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Restaurant Not Found</h2>
        <p className="text-muted-foreground text-center">This QR code is not valid or the restaurant is no longer available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Utensils className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">{restaurant.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Table {tableNumber}</span>
              <Badge variant="outline" className="text-xs">Dine-In</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Categories - Show category names */}
      <div className="px-4 py-3 bg-white border-b border-border sticky top-[65px] z-20">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {uniqueCategories.map((categoryId) => (
            <button
              key={categoryId}
              onClick={() => setSelectedCategory(categoryId)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === categoryId
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {categoryId === 'all' ? 'All Items' : getCategoryName(categoryId)}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className="p-4 cursor-pointer hover:border-primary/30 transition-colors group"
            onClick={() => addToCart(item)}
          >
            <div className="flex gap-3">
              {/* Placeholder for item image */}
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center shrink-0">
                <ChefHat className="h-8 w-8 text-muted-foreground/50" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                      {item.isVeg ? (
                        <span className="w-2 h-2 bg-primary rounded-full" title="Vegetarian" />
                      ) : (
                        <span className="w-2 h-2 bg-red-500 rounded-full" title="Non-Vegetarian" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{getCategoryName(item.category)}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-primary">₹{item.price}</span>
                    {cart.find(c => c.menuItemId === item.id) ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                          className="w-6 h-6 bg-muted rounded-full flex items-center justify-center hover:bg-muted/80"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">
                          {cart.find(c => c.menuItemId === item.id)?.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                          className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Show notes input if item is in cart */}
                {cart.find(c => c.menuItemId === item.id) && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Add special request..."
                      value={itemNotes[item.id] || ''}
                      onChange={(e) => setItemNotes({ ...itemNotes, [item.id]: e.target.value })}
                      className="text-xs h-8"
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Fixed Cart Button at Bottom */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-40 shadow-lg">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-4 px-6 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">₹{cartTotal}</p>
                <p className="text-sm text-white/70">{cartItemCount} items</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              View Cart
              <ArrowLeft className="h-5 w-5 rotate-180" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="bg-muted rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">₹{item.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">₹{item.price * item.quantity}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-8 h-8 bg-white border border-border rounded-full flex items-center justify-center hover:bg-muted"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-destructive/70 hover:text-destructive p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <Input
                      placeholder="Add special request..."
                      value={itemNotes[item.menuItemId] || item.specialRequest}
                      onChange={(e) => {
                        setItemNotes({ ...itemNotes, [item.menuItemId]: e.target.value });
                        updateSpecialRequest(item.menuItemId, e.target.value);
                      }}
                      className="mt-2 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {cart.length > 0 && (
            <SheetFooter className="flex-col gap-3 border-t pt-4">
              <div className="flex justify-between items-center w-full">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-bold text-xl">₹{cartTotal}</span>
              </div>
              <Button 
                onClick={() => { setShowCart(false); setShowCheckout(true); }}
                className="w-full bg-primary hover:bg-primary/90 h-12"
              >
                Proceed to Checkout
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Enter your details to place the order
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground">Your Name</label>
              <Input
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Mobile Number</label>
              <Input
                placeholder="Enter your mobile number"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between">
                    <span className="text-muted-foreground">{item.name} x {item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">₹{cartTotal}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCheckout(false)}
            >
              Back
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Status Tracking Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-sm">
          <div className="py-4 text-center">
            {orderStatus === 'pending_approval' && (
              <>
                <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-warning animate-pulse" />
                </div>
                <DialogTitle className="text-xl mb-2">Order Sent!</DialogTitle>
                <DialogDescription>
                  Waiting for the restaurant to accept your order...
                </DialogDescription>
              </>
            )}
            {orderStatus === 'approved' && (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <DialogTitle className="text-xl mb-2">Order Accepted!</DialogTitle>
                <DialogDescription>
                  Your order is being prepared. Sit back and relax!
                </DialogDescription>
              </>
            )}
            {orderStatus === 'rejected' && (
              <>
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <DialogTitle className="text-xl mb-2">Order Declined</DialogTitle>
                <DialogDescription>
                  Sorry, the restaurant was unable to accept your order. Please try again or ask your waiter.
                </DialogDescription>
              </>
            )}

            {/* Status Steps */}
            <div className="mt-6 space-y-3 text-left">
              {[
                { key: 'pending_approval', label: 'Order Received', icon: CheckCircle },
                { key: 'approved', label: 'Preparing', icon: ChefHat },
                { key: 'ready', label: 'Ready to Serve', icon: Bell },
              ].map((step, idx) => {
                const steps = ['pending_approval', 'approved', 'ready'];
                const currentIdx = steps.indexOf(orderStatus);
                const stepIdx = idx;
                const isComplete = currentIdx > stepIdx;
                const isCurrent = currentIdx === stepIdx;
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isComplete ? 'bg-primary text-white' :
                      isCurrent ? 'bg-primary/10 text-primary ring-2 ring-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span className={`text-sm font-medium ${
                      isComplete || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                    }`}>{step.label}</span>
                    {isCurrent && orderStatus !== 'rejected' && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <Button
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => {
              setShowSuccess(false);
              setSubmittedOrderId(null);
              setCustomerName('');
              setCustomerMobile('');
            }}
          >
            {orderStatus === 'rejected' ? 'Try Again' : 'Continue Browsing'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
