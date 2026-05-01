"use client";

/**
 * Shared tab filter component used across analytics and review pages.
 * Matches the review management page's pill-style tab UI.
 */

interface TabItem<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface TabFilterProps<T extends string> {
  tabs: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
}

export function TabFilter<T extends string>({ tabs, activeKey, onChange }: TabFilterProps<T>) {
  return (
    <div className="flex rounded-xl bg-gray-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeKey === tab.key
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1 text-xs ${activeKey === tab.key ? "text-muted" : "text-muted/60"}`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
