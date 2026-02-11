"use client";

import { PageLoading } from '@/components/PageLoading';

import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/api';

import { Card } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Receipt, Plus, Calendar, Trash2, ChevronDown, Wallet, CreditCard, Smartphone, Building2, Banknote, Tag, Settings2 } from 'lucide-react';

import type { Expense, ExpenseCategory } from '@/types/restaurant';

import { toast } from 'sonner';



export default function Expenses() {

  const { restaurant } = useAuth();

  const [showAddDialog, setShowAddDialog] = useState(false);

  const [dateRange, setDateRange] = useState('Today');

  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);

  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);



  // Form states

  const [amount, setAmount] = useState('');

  const [description, setDescription] = useState('');

  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const [expenseCategory, setExpenseCategory] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'online' | 'cheque'>('cash');

  const [vendorName, setVendorName] = useState('');

  const [receiptNumber, setReceiptNumber] = useState('');

  const [notes, setNotes] = useState('');



  // Category management

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');

  const [newCategoryColor, setNewCategoryColor] = useState('#10b981');

  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);



  const { data: expensesData } = useExpenses(restaurant?.id);

  const createExpense = useCreateExpense(restaurant?.id);

  const deleteExpenseMutation = useDeleteExpense(restaurant?.id);

  const expenses = expensesData?.expenses || [];



  const handleAddExpense = () => {

    if (!restaurant) return;

    if (!amount || parseFloat(amount) <= 0) {

      toast.error('Please enter a valid amount');

      return;

    }



    createExpense.mutate(

      {

        restaurantId: restaurant.id,

        amount: parseFloat(amount),

        description: description || 'Expense',

        date: expenseDate,

        createdBy: 'Admin',

        category: expenseCategories.find(c => c.id === expenseCategory)?.name || expenseCategory,

      },

      {

        onSuccess: () => {

          resetForm();

          setShowAddDialog(false);

          toast.success('Expense added');

        },

      }

    );

  };



  const handleDelete = (id: string) => {

    if (!restaurant) return;

    if (confirm('Delete this expense?')) {

      deleteExpenseMutation.mutate(id);

    }

  };



  const resetForm = () => {

    setAmount('');

    setDescription('');

    setExpenseDate(new Date().toISOString().split('T')[0]);

    setExpenseCategory(expenseCategories[0]?.id || '');

    setPaymentMethod('cash');

    setVendorName('');

    setReceiptNumber('');

    setNotes('');

  };



  // Get date range for filtering

  const getDateRange = () => {

    const now = new Date();

    let startDate: Date;

    let endDate: Date;



    switch (dateRange) {

      case 'Today':

        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        endDate = new Date(startDate);

        endDate.setDate(endDate.getDate() + 1);

        break;

      case 'Yesterday':

        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

        endDate = new Date(startDate);

        endDate.setDate(endDate.getDate() + 1);

        break;

      case 'This Week':

        startDate = new Date(now);

        startDate.setDate(now.getDate() - now.getDay());

        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);

        endDate.setDate(endDate.getDate() + 7);

        break;

      case 'Last Week':

        startDate = new Date(now);

        startDate.setDate(now.getDate() - now.getDay() - 7);

        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);

        endDate.setDate(endDate.getDate() + 7);

        break;

      case 'This Month':

        startDate = new Date(now.getFullYear(), now.getMonth(), 1);

        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        break;

      case 'Last Month':

        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        endDate = new Date(now.getFullYear(), now.getMonth(), 0);

        break;

      case 'Custom':

        startDate = new Date(customStartDate);

        endDate = new Date(customEndDate);

        endDate.setDate(endDate.getDate() + 1);

        break;

      default:

        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        endDate = new Date(startDate);

        endDate.setDate(endDate.getDate() + 1);

    }

    return { startDate, endDate };

  };



  const { startDate, endDate } = getDateRange();



  // Filter expenses by date range

  const filteredExpenses = expenses.filter(e => {

    const expenseDate = new Date(e.date);

    return expenseDate >= startDate && expenseDate < endDate;

  });



  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);



  // Get last 7 days for summary chart

  const last7Days = Array.from({ length: 7 }, (_, i) => {

    const d = new Date();

    d.setDate(d.getDate() - i);

    return d.toISOString().split('T')[0];

  }).reverse();



  const weeklyData = last7Days.map(date => ({

    date,

    amount: expenses.filter(e => e.date === date).reduce((sum, e) => sum + e.amount, 0)

  }));



  // Calculate payment method breakdown

  const paymentBreakdown = filteredExpenses.reduce((acc, e) => {

    const method = e.paymentMethod || 'cash';

    acc[method] = (acc[method] || 0) + e.amount;

    return acc;

  }, {} as Record<string, number>);



  // Calculate category breakdown

  const categoryBreakdown = filteredExpenses.reduce((acc, e) => {

    const cat = e.category || 'other';

    acc[cat] = (acc[cat] || 0) + e.amount;

    return acc;

  }, {} as Record<string, number>);



  const getPaymentIcon = (method: string) => {

    switch (method) {

      case 'cash': return <Banknote className="h-4 w-4" />;

      case 'upi': return <Smartphone className="h-4 w-4" />;

      case 'card': return <CreditCard className="h-4 w-4" />;

      case 'online': return <Wallet className="h-4 w-4" />;

      case 'cheque': return <Building2 className="h-4 w-4" />;

      default: return <Wallet className="h-4 w-4" />;

    }

  };



  const getDateRangeLabel = () => {

    if (dateRange === 'Today' || dateRange === 'Yesterday') {

      return dateRange;

    }

    if (dateRange === 'Custom') {

      return `${customStartDate} to ${customEndDate}`;

    }

    return dateRange;

  };



  // Category management handlers

  const handleAddCategory = () => {

    if (!restaurant || !newCategoryName.trim()) return;

    const category: ExpenseCategory = {

      id: `exp_cat_${Date.now()}`,

      name: newCategoryName.trim(),

      color: newCategoryColor,

    };

    // Expense categories stored locally for now (no dedicated API)
    setExpenseCategories(prev => [...prev, category]);

    setNewCategoryName('');

    setNewCategoryColor('#10b981');

  };



  const handleUpdateCategory = () => {

    if (!restaurant || !editingCategory || !newCategoryName.trim()) return;

    setExpenseCategories(prev => prev.map(c =>
      c.id === editingCategory.id
        ? { ...c, name: newCategoryName.trim(), color: newCategoryColor }
        : c
    ));

    setEditingCategory(null);

    setNewCategoryName('');

    setNewCategoryColor('#10b981');

  };



  const handleDeleteCategory = (categoryId: string) => {

    if (!restaurant) return;

    if (confirm('Delete this category? Expenses using this category will not be deleted.')) {

      setExpenseCategories(prev => prev.filter(c => c.id !== categoryId));

    }

  };



  const openEditCategory = (category: ExpenseCategory) => {

    setEditingCategory(category);

    setNewCategoryName(category.name);

    setNewCategoryColor(category.color || '#10b981');

  };



  const cancelEdit = () => {

    setEditingCategory(null);

    setNewCategoryName('');

    setNewCategoryColor('#10b981');

  };



  if (!restaurant) {
    return <PageLoading message="Loading expenses..." />;
  }



  return (

    <div className="min-h-screen bg-background">

      <main className="p-4 md:p-6 max-w-4xl mx-auto">

        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">

          <div className="flex items-center gap-3">

            <div className="bg-destructive p-3 rounded-xl">

              <Receipt className="h-6 w-6 text-white" />

            </div>

            <div>

              <h1 className="text-xl md:text-2xl font-bold text-foreground">Expenses</h1>

              <p className="text-muted-foreground text-sm">Track daily spending</p>

            </div>

          </div>



          <div className="flex gap-2">

            <Button

              variant="outline"

              onClick={() => setShowCategoryDialog(true)}

              className="hidden sm:flex"

            >

              <Settings2 className="h-4 w-4 mr-2" />

              Categories

            </Button>

            <Button

              onClick={() => setShowAddDialog(true)}

              className="bg-destructive hover:bg-destructive/90"

            >

              <Plus className="h-4 w-4 mr-2" />

              Add Expense

            </Button>

          </div>

        </div>



        {/* Date Selector */}

        <Card className="p-4 mb-6">

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">

            <div className="flex items-center gap-2">

              <Calendar className="h-5 w-5 text-muted-foreground" />

              <span className="font-medium text-foreground">Date Range:</span>

            </div>

            

            {/* Date Range Dropdown */}

            <div className="relative">

              <button

                onClick={() => setShowDateDropdown(!showDateDropdown)}

                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-background hover:bg-muted transition-colors"

              >

                <span>{getDateRangeLabel()}</span>

                <ChevronDown className="h-4 w-4" />

              </button>

              {showDateDropdown && (

                <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-40">

                  {['Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month', 'Custom'].map((option) => (

                    <button

                      key={option}

                      onClick={() => {

                        setDateRange(option);

                        setShowDateDropdown(false);

                      }}

                      className="block w-full text-left px-4 py-2 hover:bg-muted text-sm"

                    >

                      {option}

                    </button>

                  ))}

                </div>

              )}

            </div>



            {/* Custom Date Pickers */}

            {dateRange === 'Custom' && (

              <div className="flex items-center gap-2 flex-1">

                <Input

                  type="date"

                  value={customStartDate}

                  onChange={(e) => setCustomStartDate(e.target.value)}

                  className="flex-1"

                />

                <span className="text-muted-foreground">to</span>

                <Input

                  type="date"

                  value={customEndDate}

                  onChange={(e) => setCustomEndDate(e.target.value)}

                  className="flex-1"

                />

              </div>

            )}



            <div className="text-right sm:ml-auto">

              <span className="text-sm text-muted-foreground">Total for {dateRange}</span>

              <p className="text-2xl font-bold text-destructive">₹{totalExpenses.toLocaleString()}</p>

            </div>

          </div>

        </Card>



        {/* Weekly Trend */}

        <Card className="p-4 mb-6">

          <h3 className="font-semibold text-foreground mb-4">Last 7 Days</h3>

          <div className="flex items-end justify-between h-32 gap-2">

            {weeklyData.map((day) => (

              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">

                <div

                  className="w-full bg-destructive/20 rounded-t-lg transition-all hover:bg-destructive/30"

                  style={{

                    height: `${Math.max(4, (day.amount / Math.max(...weeklyData.map(d => d.amount), 1)) * 100)}%`,

                    minHeight: day.amount > 0 ? '16px' : '4px'

                  }}

                />

                <span className="text-xs text-muted-foreground">

                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}

                </span>

                {day.amount > 0 && (

                  <span className="text-[10px] text-muted-foreground">₹{day.amount}</span>

                )}

              </div>

            ))}

          </div>

        </Card>



        {/* Summary Cards */}

        {filteredExpenses.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            {/* Payment Method Breakdown */}

            <Card className="p-4">

              <h3 className="font-semibold text-foreground mb-3">Payment Methods</h3>

              <div className="space-y-2">

                {Object.entries(paymentBreakdown)

                  .sort(([,a], [,b]) => b - a)

                  .map(([method, amount]) => (

                    <div key={method} className="flex items-center justify-between py-1">

                      <div className="flex items-center gap-2">

                        <div className="p-1.5 bg-muted rounded">

                          {getPaymentIcon(method)}

                        </div>

                        <span className="text-sm capitalize">{method}</span>

                      </div>

                      <span className="font-medium">₹{amount.toLocaleString()}</span>

                    </div>

                  ))}

              </div>

            </Card>



            {/* Category Breakdown */}

            <Card className="p-4">

              <h3 className="font-semibold text-foreground mb-3">Categories</h3>

              <div className="space-y-2">

                {Object.entries(categoryBreakdown)

                  .sort(([,a], [,b]) => b - a)

                  .map(([cat, amount]) => (

                    <div key={cat} className="flex items-center justify-between py-1">

                      <span className="text-sm capitalize">{cat}</span>

                      <div className="flex items-center gap-3">

                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">

                          <div

                            className="h-full bg-destructive rounded-full"

                            style={{ width: `${(amount / totalExpenses) * 100}%` }}

                          />

                        </div>

                        <span className="font-medium text-sm w-16 text-right">₹{amount.toLocaleString()}</span>

                      </div>

                    </div>

                  ))}

              </div>

            </Card>

          </div>

        )}



        {/* Expenses List */}

        <Card>

          <div className="p-4 border-b bg-muted">

            <h3 className="font-semibold text-foreground">Expenses for {dateRange === 'Custom' ? `${customStartDate} to ${customEndDate}` : dateRange}</h3>

          </div>



          {filteredExpenses.length > 0 ? (

            <div className="divide-y">

              {filteredExpenses

                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

                .map((expense) => (

                  <div key={expense.id} className="p-4 hover:bg-muted/50">

                    <div className="flex items-start justify-between">

                      <div className="flex items-start gap-3">

                        <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">

                          <Receipt className="h-5 w-5 text-destructive" />

                        </div>

                        <div className="min-w-0">

                          <p className="font-medium text-foreground truncate">{expense.description}</p>

                          <div className="flex flex-wrap items-center gap-2 mt-1">

                            <span className="text-xs text-muted-foreground">{expense.date}</span>

                            {expense.category && (

                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full capitalize">

                                {expense.category}

                              </span>

                            )}

                            {expense.paymentMethod && (

                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full capitalize">

                                {expense.paymentMethod}

                              </span>

                            )}

                          </div>

                          {(expense.vendorName || expense.receiptNumber) && (

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">

                              {expense.vendorName && <span>Vendor: {expense.vendorName}</span>}

                              {expense.receiptNumber && <span>• Bill: {expense.receiptNumber}</span>}

                            </div>

                          )}

                          {expense.notes && (

                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{expense.notes}</p>

                          )}

                        </div>

                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">

                        <span className="font-bold text-destructive">₹{expense.amount.toLocaleString()}</span>

                        <button

                          onClick={() => handleDelete(expense.id)}

                          className="text-muted-foreground/50 hover:text-destructive transition-colors"

                        >

                          <Trash2 className="h-4 w-4" />

                        </button>

                      </div>

                    </div>

                  </div>

                ))}

            </div>

          ) : (

            <div className="p-12 text-center text-muted-foreground">

              <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />

              <p>No expenses for this date</p>

              <Button onClick={() => setShowAddDialog(true)} variant="outline" className="mt-4">

                Add Expense

              </Button>

            </div>

          )}

        </Card>



        {/* Add Expense Dialog */}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>

          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">

            <DialogHeader>

              <DialogTitle>Add Expense</DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-foreground">Amount *</label>

                  <Input

                    type="number"

                    value={amount}

                    onChange={(e) => setAmount(e.target.value)}

                    placeholder="0.00"

                    className="mt-1"

                    autoFocus

                  />

                </div>

                <div>

                  <label className="text-sm font-medium text-foreground">Date</label>

                  <Input

                    type="date"

                    value={expenseDate}

                    onChange={(e) => setExpenseDate(e.target.value)}

                    className="mt-1"

                  />

                </div>

              </div>



              <div>

                <label className="text-sm font-medium text-foreground">Description *</label>

                <Input

                  value={description}

                  onChange={(e) => setDescription(e.target.value)}

                  placeholder="What was this for?"

                  className="mt-1"

                />

              </div>



              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-foreground">Category</label>

                  <div className="flex gap-2">

                    <select

                      value={expenseCategory}

                      onChange={(e) => setExpenseCategory(e.target.value)}

                      className="flex-1 mt-1 p-2 border rounded-md text-sm bg-background"

                    >

                      {expenseCategories.map((cat) => (

                        <option key={cat.id} value={cat.id}>{cat.name}</option>

                      ))}

                    </select>

                    <Button

                      variant="outline"

                      size="sm"

                      className="mt-1 px-2"

                      onClick={() => setShowCategoryDialog(true)}

                    >

                      <Tag className="h-4 w-4" />

                    </Button>

                  </div>

                </div>

                <div>

                  <label className="text-sm font-medium text-foreground">Payment Method</label>

                  <select

                    value={paymentMethod}

                    onChange={(e) => setPaymentMethod(e.target.value as any)}

                    className="w-full mt-1 p-2 border rounded-md text-sm bg-background"

                  >

                    <option value="cash">Cash</option>

                    <option value="upi">UPI</option>

                    <option value="card">Card</option>

                    <option value="online">Online</option>

                    <option value="cheque">Cheque</option>

                  </select>

                </div>

              </div>



              <div className="grid grid-cols-2 gap-4">

                <div>

                  <label className="text-sm font-medium text-foreground">Vendor/Supplier</label>

                  <Input

                    value={vendorName}

                    onChange={(e) => setVendorName(e.target.value)}

                    placeholder="e.g., ABC Suppliers"

                    className="mt-1"

                  />

                </div>

                <div>

                  <label className="text-sm font-medium text-foreground">Receipt/Bill #</label>

                  <Input

                    value={receiptNumber}

                    onChange={(e) => setReceiptNumber(e.target.value)}

                    placeholder="e.g., INV-001"

                    className="mt-1"

                  />

                </div>

              </div>



              <div>

                <label className="text-sm font-medium text-foreground">Notes</label>

                <textarea

                  value={notes}

                  onChange={(e) => setNotes(e.target.value)}

                  placeholder="Additional details..."

                  rows={3}

                  className="w-full mt-1 p-2 border rounded-md text-sm bg-background resize-none"

                />

              </div>



              <div className="flex gap-3 pt-2">

                <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>

                  Cancel

                </Button>

                <Button className="flex-1 bg-destructive hover:bg-destructive/90" onClick={handleAddExpense}>

                  Add Expense

                </Button>

              </div>

            </div>

          </DialogContent>

        </Dialog>



        {/* Manage Categories Dialog */}

        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>

          <DialogContent className="sm:max-w-md">

            <DialogHeader>

              <DialogTitle>Manage Categories</DialogTitle>

            </DialogHeader>

            <div className="space-y-4">

              {/* Add/Edit Category */}

              <div className="flex gap-2">

                <Input

                  value={newCategoryName}

                  onChange={(e) => setNewCategoryName(e.target.value)}

                  placeholder={editingCategory ? 'Edit category name' : 'New category name'}

                  className="flex-1"

                />

                <input

                  type="color"

                  value={newCategoryColor}

                  onChange={(e) => setNewCategoryColor(e.target.value)}

                  className="w-10 h-10 rounded cursor-pointer"

                />

                {editingCategory ? (

                  <div className="flex gap-1">

                    <Button size="sm" onClick={handleUpdateCategory}>

                      Update

                    </Button>

                    <Button size="sm" variant="outline" onClick={cancelEdit}>

                      Cancel

                    </Button>

                  </div>

                ) : (

                  <Button size="sm" onClick={handleAddCategory}>

                    <Plus className="h-4 w-4" />

                  </Button>

                )}

              </div>



              {/* Categories List */}

              <div className="space-y-2 max-h-60 overflow-y-auto">

                {expenseCategories.map((category) => (

                  <div

                    key={category.id}

                    className="flex items-center justify-between p-2 bg-muted rounded-lg"

                  >

                    <div className="flex items-center gap-2">

                      <div

                        className="w-4 h-4 rounded-full"

                        style={{ backgroundColor: category.color || '#6b7280' }}

                      />

                      <span className="text-sm">{category.name}</span>

                    </div>

                    <div className="flex gap-1">

                      <Button

                        variant="ghost"

                        size="sm"

                        onClick={() => openEditCategory(category)}

                      >

                        Edit

                      </Button>

                      <Button

                        variant="ghost"

                        size="sm"

                        className="text-destructive"

                        onClick={() => handleDeleteCategory(category.id)}

                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </DialogContent>

        </Dialog>

      </main>

    </div>

  );

}



