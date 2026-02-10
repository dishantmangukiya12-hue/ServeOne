"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import type { MenuItem, ModifierGroup, ModifierOption, SelectedModifier } from '@/services/dataService';

interface ModifierSelectDialogProps {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onConfirm: (item: MenuItem, modifiers: SelectedModifier[], quantity: number) => void;
}

export function ModifierSelectDialog({
  open,
  onClose,
  item,
  onConfirm,
}: ModifierSelectDialogProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, ModifierOption[]>>({});
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open && item) {
      // Reset selections when dialog opens
      setSelectedModifiers({});
      setQuantity(1);
    }
  }, [open, item]);

  if (!item) return null;

  const modifierGroups = item.modifiers || [];

  const handleOptionToggle = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedModifiers(prev => {
      const currentSelection = prev[group.id] || [];

      if (group.multiSelect) {
        // Toggle selection for multi-select
        const isSelected = currentSelection.some(o => o.id === option.id);
        if (isSelected) {
          return {
            ...prev,
            [group.id]: currentSelection.filter(o => o.id !== option.id)
          };
        } else {
          return {
            ...prev,
            [group.id]: [...currentSelection, option]
          };
        }
      } else {
        // Single select - replace selection
        return {
          ...prev,
          [group.id]: [option]
        };
      }
    });
  };

  const isOptionSelected = (groupId: string, optionId: string) => {
    return selectedModifiers[groupId]?.some(o => o.id === optionId) || false;
  };

  const canConfirm = () => {
    // Check all required groups have selection
    return modifierGroups.every(group => {
      if (!group.required) return true;
      return (selectedModifiers[group.id]?.length || 0) > 0;
    });
  };

  const calculateTotalPrice = () => {
    let total = item.price;
    Object.values(selectedModifiers).forEach(options => {
      options.forEach(opt => {
        total += opt.price;
      });
    });
    return total * quantity;
  };

  const handleConfirm = () => {
    const modifiers: SelectedModifier[] = modifierGroups
      .filter(group => selectedModifiers[group.id]?.length > 0)
      .map(group => ({
        groupId: group.id,
        groupName: group.name,
        options: selectedModifiers[group.id]
      }));

    onConfirm(item, modifiers, quantity);
    onClose();
  };

  // If no modifiers, just confirm immediately
  if (modifierGroups.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-primary' : 'bg-destructive'}`} />
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modifier Groups */}
          {modifierGroups.map(group => (
            <div key={group.id}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground">{group.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  group.required
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {group.required ? 'Required' : 'Optional'}
                  {group.multiSelect && ' • Multi'}
                </span>
              </div>

              <div className="space-y-2">
                {group.options.map(option => {
                  const isSelected = isOptionSelected(group.id, option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionToggle(group, option)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-foreground">{option.name}</span>
                      </div>
                      {option.price > 0 && (
                        <span className="text-primary font-medium">+₹{option.price}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent"
              >
                -
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
              >
                +
              </button>
            </div>
          </div>

          {/* Total & Confirm */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleConfirm}
              disabled={!canConfirm()}
            >
              Add ₹{calculateTotalPrice()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

