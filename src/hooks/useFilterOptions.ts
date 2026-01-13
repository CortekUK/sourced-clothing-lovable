import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FilterOptions {
  categories: string[];
  fabrics: string[];
  sizes: string[];
  colors: string[];
  priceRange: { min: number; max: number };
}

export const useFilterOptions = () => {
  const { user, session } = useAuth();
  
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async (): Promise<FilterOptions> => {
      // Get distinct values for each filter field
      const { data: products, error } = await supabase
        .from('products')
        .select('category, metal, karat, gemstone, unit_price')
        .not('unit_price', 'is', null);

      if (error) throw error;

      // Clothing-specific categories (exclude jewelry)
      const clothingCategories = ['Shirts', 'Pants', 'Dresses', 'Jackets', 'Skirts', 'Coats', 'Accessories', 'Shoes', 'Tops', 'Blouses', 'Sweaters', 'Hoodies', 'Suits', 'Blazers', 'Shorts', 'Jeans', 'Loungewear', 'Activewear', 'Outerwear', 'Underwear', 'Swimwear'];

      // Clothing-specific fabrics (exclude metals)
      const clothingFabrics = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim', 'Leather', 'Cashmere', 'Velvet', 'Satin', 'Chiffon', 'Tweed', 'Corduroy', 'Fleece', 'Jersey', 'Nylon', 'Rayon', 'Spandex', 'Suede', 'Canvas'];

      // Non-clothing materials to exclude
      const excludedMaterials = ['steel', 'stainless steel', 'gold', 'silver', 'white gold', 'rose gold', 'platinum', 'bi-metal', 'titanium', 'brass', 'copper'];

      // Extract unique values and filter out nulls/empty strings
      const dbCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      const dbFabrics = [...new Set(products.map(p => p.metal).filter(Boolean))];
      const dbSizes = [...new Set(products.map(p => p.karat).filter(Boolean))];
      const dbColors = [...new Set(products.map(p => p.gemstone).filter(Boolean))];

      // Filter out jewelry categories
      const jewelryCategories = ['rings', 'necklaces', 'earrings', 'bracelets', 'watches', 'pendants', 'chains'];
      const filteredDbCategories = dbCategories.filter(c => !jewelryCategories.includes(c.toLowerCase()));

      // Filter out metal materials from fabrics
      const filteredDbFabrics = dbFabrics.filter(f => !excludedMaterials.includes(f.toLowerCase()));

      // Merge with clothing defaults
      const allCategories = [...new Set([
        ...filteredDbCategories,
        ...clothingCategories
      ])].sort();

      const allFabrics = [...new Set([
        ...filteredDbFabrics,
        ...clothingFabrics
      ])].sort();

      const allSizes = [...new Set([
        ...dbSizes,
        'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'
      ])].sort();

      const allColors = [...new Set([
        ...dbColors,
        'Black', 'White', 'Red', 'Blue', 'Green', 'Navy', 'Gray', 'Beige', 'Brown', 'Pink'
      ])].sort();

      // Calculate price range
      const prices = products.map(p => Number(p.unit_price)).filter(p => p > 0);
      const minPrice = Math.floor(Math.min(...prices) / 100) * 100; // Round down to nearest 100
      const maxPrice = Math.ceil(Math.max(...prices) / 100) * 100;  // Round up to nearest 100

      return {
        categories: allCategories,
        fabrics: allFabrics,
        sizes: allSizes,
        colors: allColors,
        priceRange: {
          min: minPrice || 0,
          max: maxPrice || 50000
        }
      };
    },
    enabled: !!user && !!session,
  });
};