"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataRefresh } from '@/hooks/useServerSync';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { User } from '@/services/dataService';
import { getRestaurantData, saveRestaurantData } from '@/services/dataService';

export default function Users() {
  const { restaurant } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen'>('waiter');

  const loadUsers = useCallback(() => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data) {
      setUsers(data.users);
    }
  }, [restaurant]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useDataRefresh(loadUsers);

  const handleAddUser = () => {
    if (!restaurant) return;
    const newUser: User = {
      id: `user_${Date.now()}`,
      restaurantId: restaurant.id,
      name,
      email,
      mobile: '',
      passcode: '1234', // Default passcode
      role,
      status: 'active'
    };

    const data = getRestaurantData(restaurant.id);
    if (data) {
      data.users.push(newUser);
      saveRestaurantData(restaurant.id, data);
      loadUsers();
    }

    setName('');
    setEmail('');
    setRole('waiter');
    setShowAddDialog(false);
  };

  const handleEditUser = () => {
    if (!editingUser || !restaurant) return;

    const data = getRestaurantData(restaurant.id);
    if (data) {
      const index = data.users.findIndex(u => u.id === editingUser.id);
      if (index !== -1) {
        data.users[index] = { ...editingUser, name, email, role };
        saveRestaurantData(restaurant.id, data);
        loadUsers();
      }
    }

    setEditingUser(null);
    setShowEditDialog(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (!restaurant) return;
    if (confirm('Are you sure you want to delete this user?')) {
      const data = getRestaurantData(restaurant.id);
      if (data) {
        data.users = data.users.filter(u => u.id !== userId);
        saveRestaurantData(restaurant.id, data);
        loadUsers();
      }
    }
  };

  const toggleUserStatus = (user: User) => {
    if (!restaurant) return;
    const data = getRestaurantData(restaurant.id);
    if (data) {
      const index = data.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        data.users[index].status = user.status === 'active' ? 'inactive' : 'active';
        saveRestaurantData(restaurant.id, data);
        loadUsers();
      }
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setShowEditDialog(true);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Staff Management</h1>
          <Button
            className="bg-primary hover:bg-primary/90 text-sm"
            onClick={() => {
              setName('');
              setEmail('');
              setRole('waiter');
              setShowAddDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            <span className="md:hidden">Add</span>
            <span className="hidden md:inline">Add Staff</span>
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="p-3 md:p-4 border-b">
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-full md:max-w-md text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-muted">
                <tr className="border-b">
                  <th className="p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Name</th>
                  <th className="hidden sm:table-cell p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Email</th>
                  <th className="p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Role</th>
                  <th className="p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-2 md:p-4 text-left text-xs md:text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted">
                      <td className="p-2 md:p-4">
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="sm:hidden text-xs text-muted-foreground">{user.email || '-'}</div>
                      </td>
                      <td className="hidden sm:table-cell p-2 md:p-4 text-muted-foreground text-sm">{user.email || '-'}</td>
                      <td className="p-2 md:p-4">
                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs ${
                          user.role === 'admin' ? 'bg-primary/10 text-primary' :
                          user.role === 'manager' ? 'bg-info/10 text-info' :
                          user.role === 'cashier' ? 'bg-warning/10 text-warning' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="p-2 md:p-4">
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className={`px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs ${
                            user.status === 'active'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {user.status}
                        </button>
                      </td>
                      <td className="p-2 md:p-4">
                        <div className="flex gap-1 md:gap-2">
                          <button
                            onClick={() => openEditDialog(user)}
                            className="text-primary hover:bg-primary/10 p-1.5 md:p-2 rounded"
                          >
                            <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive hover:bg-destructive/10 p-1.5 md:p-2 rounded"
                            >
                              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-8 md:p-16 text-center text-muted-foreground" colSpan={5}>
                      <div className="text-4xl md:text-6xl mb-4">👥</div>
                      <p className="text-base md:text-lg mb-2">No staff added</p>
                      <p className="text-xs md:text-sm">Click &quot;Add Staff&quot; to create staff accounts</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter staff name"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Role *</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen')}
              >
                <option value="waiter">Waiter</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddDialog(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleAddUser}
                disabled={!name}
              >
                ADD
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter staff name"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Role *</label>
              <select
                className="w-full border rounded-lg p-2 mt-1"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'manager' | 'waiter' | 'cashier' | 'kitchen')}
              >
                <option value="waiter">Waiter</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditDialog(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleEditUser}
                disabled={!name}
              >
                UPDATE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

