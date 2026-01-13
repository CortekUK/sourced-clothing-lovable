import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ConsignmentItem {
  id: number;
  product_id: number;
  product_name: string;
  internal_sku: string;
  agreed_payout: number;
  status: 'active' | 'sold' | 'settled';
  sold_price?: number;
  sold_at?: string;
  paid_at?: string;
  gross_profit?: number;
  settlement_id?: number;
}

export function useSupplierConsignments(
  supplierId: number,
  startDate?: Date,
  endDate?: Date,
  statusFilter?: string
) {
  return useQuery({
    queryKey: ['supplier-consignments', supplierId, startDate, endDate, statusFilter],
    queryFn: async (): Promise<ConsignmentItem[]> => {
      // Get consignment products for this supplier
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          internal_sku,
          unit_cost,
          is_consignment,
          consignment_supplier_id
        `)
        .eq('is_consignment', true)
        .eq('consignment_supplier_id', supplierId);

      const { data: products, error: productsError } = await query;

      if (productsError) throw productsError;
      if (!products || products.length === 0) return [];

      // Get settlements for these products
      const productIds = products.map(p => p.id);
      const { data: settlements, error: settlementsError } = await supabase
        .from('consignment_settlements')
        .select(`
          id,
          product_id,
          sale_id,
          sale_price,
          payout_amount,
          paid_at,
          sales (
            sold_at
          )
        `)
        .in('product_id', productIds);

      if (settlementsError) throw settlementsError;

      // Map products to consignment items
      const items: ConsignmentItem[] = products.map(product => {
        const settlement = settlements?.find(s => s.product_id === product.id);
        
        let status: 'active' | 'sold' | 'settled' = 'active';
        if (settlement?.paid_at) {
          status = 'settled';
        } else if (settlement?.sale_id) {
          status = 'sold';
        }

        const soldPrice = settlement?.sale_price || undefined;
        const agreedPayout = settlement?.payout_amount || product.unit_cost;
        const grossProfit = soldPrice ? soldPrice - agreedPayout : undefined;

        return {
          id: product.id,
          product_id: product.id,
          product_name: product.name,
          internal_sku: product.internal_sku,
          agreed_payout: agreedPayout,
          status,
          sold_price: soldPrice,
          sold_at: settlement?.sales?.sold_at,
          paid_at: settlement?.paid_at || undefined,
          gross_profit: grossProfit,
          settlement_id: settlement?.id
        };
      });

      // Apply status filter
      let filtered = items;
      if (statusFilter && statusFilter !== 'all') {
        filtered = items.filter(item => item.status === statusFilter);
      }

      return filtered;
    },
    enabled: !!supplierId
  });
}
