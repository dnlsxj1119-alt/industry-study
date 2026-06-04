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
    <div className="flex flex-wrap gap-2 pb-2">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
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
