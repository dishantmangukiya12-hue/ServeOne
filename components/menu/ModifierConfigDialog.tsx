"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { MenuItem, ModifierGroup, ModifierOption } from '@/services/dataService';

interface ModifierConfigDialogProps {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onSave: (modifiers: ModifierGroup[]) => void;
}

export function ModifierConfigDialog({
  open,
  onClose,
  item,
  onSave,
}: ModifierConfigDialogProps) {
  const [groups, setGroups] = useState<ModifierGroup[]>([]);

  useEffect(() => {
    if (open && item) {
      setGroups(item.modifiers || []);
    }
  }, [open, item]);

  const addGroup = () => {
    const newGroup: ModifierGroup = {
      id: `modgroup_${Date.now()}`,
      name: '',
      required: false,
      multiSelect: false,
      options: []
    };
    setGroups([...groups, newGroup]);
  };

  const updateGroup = (groupId: string, updates: Partial<ModifierGroup>) => {
    setGroups(groups.map(g =>
      g.id === groupId ? { ...g, ...updates } : g
    ));
  };

  const removeGroup = (groupId: string) => {
    setGroups(groups.filter(g => g.id !== groupId));
  };

  const addOption = (groupId: string) => {
    const newOption: ModifierOption = {
      id: `modopt_${Date.now()}`,
      name: '',
      price: 0
    };
    setGroups(groups.map(g =>
      g.id === groupId
        ? { ...g, options: [...g.options, newOption] }
        : g
    ));
  };

  const updateOption = (groupId: string, optionId: string, updates: Partial<ModifierOption>) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        options: g.options.map(o =>
          o.id === optionId ? { ...o, ...updates } : o
        )
      };
    }));
  };

  const removeOption = (groupId: string, optionId: string) => {
    setGroups(groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        options: g.options.filter(o => o.id !== optionId)
      };
    }));
  };

  const handleSave = () => {
    // Filter out groups with empty names
    const validGroups = groups
      .filter(g => g.name.trim())
      .map(g => ({
        ...g,
        options: g.options.filter(o => o.name.trim())
      }));
    onSave(validGroups);
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Modifiers - {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No modifiers configured</p>
              <p className="text-sm">Add modifier groups like "Spice Level", "Add-ons", etc.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="border border-border rounded-lg p-4">
                {/* Group Header */}
                <div className="flex items-start gap-2 mb-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Group name (e.g., Spice Level)"
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                    />
                    <div className="flex items-center gap-4 text-sm">
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={group.required}
                          onCheckedChange={(checked) => updateGroup(group.id, { required: checked })}
                          className="scale-75 data-[state=checked]:bg-primary"
                        />
                        Required
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={group.multiSelect}
                          onCheckedChange={(checked) => updateGroup(group.id, { multiSelect: checked })}
                          className="scale-75 data-[state=checked]:bg-primary"
                        />
                        Multi-select
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => removeGroup(group.id)}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Options */}
                <div className="ml-7 space-y-2">
                  {group.options.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Input
                        placeholder="Option name"
                        value={option.name}
                        onChange={(e) => updateOption(group.id, option.id, { name: e.target.value })}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground text-sm">+₹</span>
                        <Input
                          type="number"
                          placeholder="0"
                          value={option.price || ''}
                          onChange={(e) => updateOption(group.id, option.id, { price: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </div>
                      <button
                        onClick={() => removeOption(group.id, option.id)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(group.id)}
                    className="text-primary text-sm flex items-center gap-1 hover:text-primary/90"
                  >
                    <Plus className="h-3 w-3" />
                    Add Option
                  </button>
                </div>
              </div>
            ))
          )}

          <button
            onClick={addGroup}
            className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Modifier Group
          </button>

          {/* Quick Templates */}
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">Quick add common modifiers:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Spice Level', options: ['Mild', 'Medium', 'Hot', 'Extra Hot'] },
                { name: 'Size', options: ['Small', 'Regular', 'Large'] },
                { name: 'Add-ons', options: ['Extra Cheese +₹30', 'Double Portion +₹50'] },
              ].map(template => (
                <button
                  key={template.name}
                  onClick={() => {
                    const newGroup: ModifierGroup = {
                      id: `modgroup_${Date.now()}_${Math.random()}`,
                      name: template.name,
                      required: false,
                      multiSelect: template.name === 'Add-ons',
                      options: template.options.map((opt, i) => {
                        const priceMatch = opt.match(/\+₹(\d+)/);
                        return {
                          id: `modopt_${Date.now()}_${i}`,
                          name: opt.replace(/\s*\+₹\d+/, ''),
                          price: priceMatch ? parseInt(priceMatch[1]) : 0
                        };
                      })
                    };
                    setGroups([...groups, newGroup]);
                  }}
                  className="px-3 py-1 text-xs bg-muted rounded-full hover:bg-accent"
                >
                  + {template.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleSave}
            >
              Save Modifiers
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

