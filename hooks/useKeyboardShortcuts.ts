"use client";

import { useEffect, useCallback } from 'react';

interface KeyboardShortcuts {
  onEscape?: () => void;
  onEnter?: () => void;
  onTableSelect?: (tableNumber: string) => void;
  onNewOrder?: () => void; // N key
  onSearch?: () => void; // / key
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onEscape,
  onEnter,
  onTableSelect,
  onNewOrder,
  onSearch,
  enabled = true,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable;

    // Allow Escape in input fields
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    // Block other shortcuts in input fields
    if (isInputField) return;

    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;

      case 'n':
      case 'N':
        if (onNewOrder && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          onNewOrder();
        }
        break;

      case '/':
        if (onSearch) {
          event.preventDefault();
          onSearch();
        }
        break;

      // Number keys for quick table selection
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        if (onTableSelect) {
          // Store the first digit and wait for second
          const existingDigit = sessionStorage.getItem('tableDigit');
          const now = Date.now();
          const lastTime = parseInt(sessionStorage.getItem('tableDigitTime') || '0');

          if (existingDigit && (now - lastTime) < 1000) {
            // Second digit within 1 second - select table
            const tableNum = existingDigit + event.key;
            sessionStorage.removeItem('tableDigit');
            sessionStorage.removeItem('tableDigitTime');
            onTableSelect(tableNum);
          } else {
            // First digit - store it
            sessionStorage.setItem('tableDigit', event.key);
            sessionStorage.setItem('tableDigitTime', String(now));
          }
        }
        break;
    }
  }, [enabled, onEscape, onEnter, onTableSelect, onNewOrder, onSearch]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Hook to show keyboard shortcuts help
export function getKeyboardShortcutsHelp() {
  return [
    { key: 'Esc', description: 'Go back / Close dialog' },
    { key: 'Enter', description: 'Confirm action' },
    { key: 'N', description: 'New order' },
    { key: '/', description: 'Search' },
    { key: '01-20', description: 'Quick select table' },
  ];
}

