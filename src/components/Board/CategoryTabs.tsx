import React from 'react';
import { Category } from '../../types';
import { cn } from '../../lib/utils';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: Category;
  onSelect: (category: Category) => void;
}

export function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
            activeCategory === category
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
