"use client";

interface OrderTabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function OrderTabs({ tabs, activeTab, onChange }: OrderTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4 md:mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base whitespace-nowrap transition-colors ${
            activeTab === tab
              ? 'bg-primary text-white shadow-md shadow-primary/20'
              : 'bg-card text-muted-foreground hover:bg-muted border border-border'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

