"use client";

import { useState, useMemo } from 'react';
import type { Table, Order } from '@/types/restaurant';
import { TableCard } from './TableCard';

interface TableGridProps {
  tables: Table[];
  getOrderForTable: (table: Table) => Order | null;
  onTableClick: (table: Table) => void;
  onMenuClick: (e: React.MouseEvent, table: Table) => void;
  formatOrderTime: (createdAt: string) => string;
}

export function TableGrid({
  tables,
  getOrderForTable,
  onTableClick,
  onMenuClick,
  formatOrderTime,
}: TableGridProps) {
  const [activeSection, setActiveSection] = useState('All');

  const sections = useMemo(() => {
    const sectionSet = new Set(tables.map(t => t.section || 'General'));
    const arr = Array.from(sectionSet);
    return arr.length > 1 ? ['All', ...arr] : [];
  }, [tables]);

  const filteredTables = activeSection === 'All'
    ? tables
    : tables.filter(t => (t.section || 'General') === activeSection);

  return (
    <div>
      {sections.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {sections.map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === section
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {section}
            </button>
          ))}
        </div>
      )}
      {filteredTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" /></svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No tables found</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Go to Settings to add tables, then come back here to start taking orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
          {filteredTables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              order={getOrderForTable(table)}
              onTableClick={onTableClick}
              onMenuClick={onMenuClick}
              formatOrderTime={formatOrderTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}

