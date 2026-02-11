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
    </div>
  );
}

