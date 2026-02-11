import { Scissors, Sparkles, Eye, Smile, Heart } from 'lucide-react';

interface CategoryChipsProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  totalCount: number;
  filteredCount: number;
}

const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();

  if (lowerCategory.includes('ongle')) return Sparkles;
  if (lowerCategory.includes('cheveu') || lowerCategory.includes('coiffure')) return Scissors;
  if (lowerCategory.includes('cil') || lowerCategory.includes('regard')) return Eye;
  if (lowerCategory.includes('maquillage') || lowerCategory.includes('makeup')) return Smile;

  return Heart;
};

export default function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
  totalCount,
  filteredCount,
}: CategoryChipsProps) {
  const allCategories = ['all', ...categories];

  return (
    <div className="relative">
      <div className="overflow-x-auto hide-scrollbar pb-2">
        <div className="flex gap-2 min-w-max px-1">
          {allCategories.map((category) => {
            const isSelected = selectedCategory === category;
            const Icon = category === 'all' ? Heart : getCategoryIcon(category);
            const displayName = category === 'all' ? 'Tout' : category;
            const count = category === 'all' ? totalCount : filteredCount;

            return (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-belleya-powder to-belleya-bright text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:shadow-md hover:scale-105 border-2 border-brand-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{displayName}</span>
                {isSelected && category === 'all' && (
                  <span className="ml-1 px-2 py-0.5 bg-white/30 rounded-full text-xs font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedCategory !== 'all' && (
        <div className="mt-2 text-xs text-gray-600 font-medium px-1">
          {filteredCount} {filteredCount === 1 ? 'pro trouvée' : 'pros trouvées'}
        </div>
      )}
    </div>
  );
}
