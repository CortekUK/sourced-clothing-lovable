import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Watch, 
  CircleDot, 
  Gem, 
  Heart,
  Star,
  Coins,
  Sparkles,
  Crown,
  Diamond,
  Zap,
  Package,
  AlertTriangle,
  X,
  Settings,
  PoundSterling,
  Repeat
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface QuickFiltersProps {
  filters: {
    categories: string[];
    fabrics: string[];
    sizes: string[];
    colors: string[];
    suppliers: string[];
    stockLevel: 'all' | 'in' | 'risk' | 'out';
    priceRange: { min: number; max: number };
    marginRange: { min: number; max: number };
    isTradeIn?: 'all' | 'trade_in_only' | 'non_trade_in';
  };
  onFiltersChange: (filters: any) => void;
  filterOptions: {
    categories: string[];
    fabrics: string[];
    sizes: string[];
    colors: string[];
    priceRange: { min: number; max: number };
  };
  onOpenFullFilters: () => void;
  activeFilters: number;
  onClearAll: () => void;
}

interface PresetConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: 'category' | 'fabric' | 'stock' | 'price';
  filterValue: any;
}

// All available presets
const allPresets: PresetConfig[] = [
  // Most popular categories
  { id: 'shirts', label: 'Shirts', icon: Package, type: 'category', filterValue: { categories: ['Shirts'] } },
  { id: 'pants', label: 'Pants', icon: Package, type: 'category', filterValue: { categories: ['Pants'] } },
  { id: 'dresses', label: 'Dresses', icon: Star, type: 'category', filterValue: { categories: ['Dresses'] } },
  { id: 'jackets', label: 'Jackets', icon: Crown, type: 'category', filterValue: { categories: ['Jackets'] } },
  { id: 'accessories', label: 'Accessories', icon: Gem, type: 'category', filterValue: { categories: ['Accessories'] } },

  // Most popular fabrics
  { id: 'cotton', label: 'Cotton', icon: Sparkles, type: 'fabric', filterValue: { fabrics: ['Cotton'] } },
  { id: 'silk', label: 'Silk', icon: Diamond, type: 'fabric', filterValue: { fabrics: ['Silk'] } },
  { id: 'wool', label: 'Wool', icon: Heart, type: 'fabric', filterValue: { fabrics: ['Wool'] } },
  { id: 'denim', label: 'Denim', icon: Zap, type: 'fabric', filterValue: { fabrics: ['Denim'] } },
  { id: 'leather', label: 'Leather', icon: Coins, type: 'fabric', filterValue: { fabrics: ['Leather'] } },

  // Stock filters
  { id: 'in-stock', label: 'In Stock', icon: Package, type: 'stock', filterValue: { stockLevel: 'in' } },
  { id: 'at-risk', label: 'At Risk', icon: AlertTriangle, type: 'stock', filterValue: { stockLevel: 'risk' } },
  { id: 'out-of-stock', label: 'Out of Stock', icon: X, type: 'stock', filterValue: { stockLevel: 'out' } },

  // Part Exchange filter
  { id: 'part-exchange', label: 'Part Exchange', icon: Repeat, type: 'stock', filterValue: { isTradeIn: 'trade_in_only' } },

  // Price presets
  { id: 'under-50', label: '< £50', icon: PoundSterling, type: 'price', filterValue: { priceRange: { min: 0, max: 50 } } },
  { id: '50-100', label: '£50–£100', icon: PoundSterling, type: 'price', filterValue: { priceRange: { min: 50, max: 100 } } },
  { id: '100-500', label: '£100–£500', icon: PoundSterling, type: 'price', filterValue: { priceRange: { min: 100, max: 500 } } },
  { id: 'over-500', label: '> £500', icon: PoundSterling, type: 'price', filterValue: { priceRange: { min: 500, max: 50000 } } },
];

export function QuickFilters({
  filters,
  onFiltersChange,
  filterOptions,
  onOpenFullFilters,
  onClearAll
}: QuickFiltersProps) {
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Filter presets based on settings
  const activePresets = allPresets.filter(preset => 
    settings.quickFilterPresets.includes(preset.id)
  );

  const isPresetActive = (preset: PresetConfig): boolean => {
    switch (preset.type) {
      case 'category':
        return preset.filterValue.categories.some((cat: string) => filters.categories.includes(cat));
      case 'fabric':
        return preset.filterValue.fabrics.some((fabric: string) => filters.fabrics.includes(fabric));
      case 'stock':
        // Handle both stock level and trade-in filters
        if (preset.filterValue.stockLevel) {
          return filters.stockLevel === preset.filterValue.stockLevel;
        }
        if (preset.filterValue.isTradeIn) {
          return filters.isTradeIn === preset.filterValue.isTradeIn;
        }
        return false;
      case 'price':
        const { min, max } = preset.filterValue.priceRange;
        return filters.priceRange.min === min && filters.priceRange.max === max;
      default:
        return false;
    }
  };

  const togglePreset = (preset: PresetConfig) => {
    const isActive = isPresetActive(preset);

    switch (preset.type) {
      case 'category':
        const newCategories = isActive
          ? filters.categories.filter(cat => !preset.filterValue.categories.includes(cat))
          : [...new Set([...filters.categories, ...preset.filterValue.categories])];
        onFiltersChange({ ...filters, categories: newCategories });
        break;

      case 'fabric':
        const newFabrics = isActive
          ? filters.fabrics.filter(fabric => !preset.filterValue.fabrics.includes(fabric))
          : [...new Set([...filters.fabrics, ...preset.filterValue.fabrics])];
        onFiltersChange({ ...filters, fabrics: newFabrics });
        break;

      case 'stock':
        // Handle both stock level and trade-in filters
        if (preset.filterValue.stockLevel) {
          const newStockLevel = isActive ? 'all' : preset.filterValue.stockLevel;
          onFiltersChange({ ...filters, stockLevel: newStockLevel });
        }
        if (preset.filterValue.isTradeIn) {
          const newTradeIn = isActive ? 'all' : preset.filterValue.isTradeIn;
          onFiltersChange({ ...filters, isTradeIn: newTradeIn });
        }
        break;

      case 'price':
        if (isActive) {
          // Reset to full range if this preset is active
          onFiltersChange({
            ...filters,
            priceRange: {
              min: filterOptions.priceRange.min,
              max: filterOptions.priceRange.max
            }
          });
        } else {
          // Apply this preset (price presets are mutually exclusive)
          onFiltersChange({ ...filters, priceRange: preset.filterValue.priceRange });
        }
        break;
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Quick Filter Pills */}
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
               style={{ width: '100%', maxWidth: 'calc(100vw - 8rem)' }}>
            {activePresets.map((preset) => {
              const isActive = isPresetActive(preset);
              const Icon = preset.icon;
              
              return (
                <Button
                  key={preset.id}
                  variant="outline" 
                  size="sm"
                  onClick={() => togglePreset(preset)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap transition-all flex-shrink-0",
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-gold" 
                      : "hover:border-primary/50 hover:bg-primary/5"
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="h-3 w-3" />
                  {preset.label}
                </Button>
              );
            })}
            
            {/* Edit Quick Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings?section=quick-filters')}
              className="flex items-center gap-2 whitespace-nowrap hover:border-primary/50 hover:bg-primary/5 flex-shrink-0"
            >
              <Settings className="h-3 w-3" />
              Edit
            </Button>
          </div>
        </div>
        
        {/* Clear All Button */}
        {(filters.categories.length > 0 ||
          filters.fabrics.length > 0 ||
          filters.stockLevel !== 'all' ||
          filters.priceRange.min > filterOptions.priceRange.min ||
          filters.priceRange.max < filterOptions.priceRange.max) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filter Summary */}
      {(filters.categories.length > 0 ||
        filters.fabrics.length > 0 ||
        filters.stockLevel !== 'all' ||
        filters.priceRange.min > filterOptions.priceRange.min ||
        filters.priceRange.max < filterOptions.priceRange.max) && (
        <div className="flex flex-wrap gap-2">
          {filters.categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {category}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => {
                  const newCategories = filters.categories.filter(c => c !== category);
                  onFiltersChange({ ...filters, categories: newCategories });
                }}
              />
            </Badge>
          ))}

          {filters.fabrics.map((fabric) => (
            <Badge
              key={fabric}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {fabric}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => {
                  const newFabrics = filters.fabrics.filter(f => f !== fabric);
                  onFiltersChange({ ...filters, fabrics: newFabrics });
                }}
              />
            </Badge>
          ))}
          
          {filters.stockLevel !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {filters.stockLevel === 'in' ? 'In Stock' : 
               filters.stockLevel === 'risk' ? 'At Risk' : 'Out of Stock'}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFiltersChange({ ...filters, stockLevel: 'all' })}
              />
            </Badge>
          )}
          
          {(filters.priceRange.min > filterOptions.priceRange.min ||
            filters.priceRange.max < filterOptions.priceRange.max) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              £{filters.priceRange.min.toLocaleString()} - £{filters.priceRange.max.toLocaleString()}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => onFiltersChange({ 
                  ...filters, 
                  priceRange: { 
                    min: filterOptions.priceRange.min, 
                    max: filterOptions.priceRange.max 
                  } 
                })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}