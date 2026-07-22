import React from "react";

export interface TabItem {
  value: string; // Unique identifier for the tab
  label: string; // Visible label
  count?: number; // Optional badge count shown next to the label
}

interface TabsProps {
  items: TabItem[];
  value: string; // Currently selected tab value
  onChange: (value: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ items, value, onChange }) => {
  return (
    <div className="no-scrollbar flex items-center gap-0.5 overflow-x-auto rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`whitespace-nowrap rounded-md px-3.5 py-2 text-theme-sm font-medium transition-colors hover:text-gray-900 dark:hover:text-white ${
              isActive
                ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="ml-1.5 text-gray-400 dark:text-gray-500">
                ({item.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
