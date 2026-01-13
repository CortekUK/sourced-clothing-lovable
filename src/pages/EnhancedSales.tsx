import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ShoppingCartComponent } from '@/components/pos/ShoppingCart';
import { CheckoutForm, DiscountType } from '@/components/pos/CheckoutForm';
import { SaleConfirmationModal } from '@/components/pos/SaleConfirmationModal';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, Product } from '@/types';

export default function EnhancedSales() {
  const { settings } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState<string | null>(null);
  const [staffMember, setStaffMember] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<{ sale: any; items: any[]; signature: string | null } | null>(null);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount;
  const taxAmount = cart.reduce((sum, item) => {
    const itemSubtotal = item.unit_price * item.quantity;
    const itemDiscountRatio = discountType === 'percentage'
      ? discount / 100
      : subtotal > 0 ? discountAmount / subtotal : 0;
    const itemAfterDiscount = itemSubtotal - (itemSubtotal * itemDiscountRatio);
    return sum + (itemAfterDiscount * (item.product.tax_rate / 100));
  }, 0);
  const total = subtotal - discountAmount + taxAmount;

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        unit_price: product.unit_price,
        unit_cost: product.unit_cost,
        tax_rate: product.tax_rate,
        discount: 0
      };
      setCart([...cart, newItem]);
    }

    toast({
      title: 'Added to cart',
      description: `${product.name}`,
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product.id !== productId));
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Complete sale mutation
  const completeSaleMutation = useMutation({
    mutationFn: async () => {
      // Validate stock availability before sale
      if (cart.length > 0) {
        const { data: stockData, error: stockError } = await supabase
          .from('v_stock_on_hand')
          .select('product_id, qty_on_hand')
          .in('product_id', cart.map(item => item.product.id));

        if (stockError) throw new Error('Failed to verify stock availability');

        const stockMap = new Map(stockData?.map(s => [s.product_id, s.qty_on_hand]) || []);

        for (const item of cart) {
          if (item.product.track_stock) {
            const available = stockMap.get(item.product.id) || 0;
            if (available < item.quantity) {
              throw new Error(`Insufficient stock for "${item.product.name}". Available: ${available}, Requested: ${item.quantity}`);
            }
          }
        }
      }

      const saleData = {
        staff_id: user?.id,
        staff_member_name: staffMember,
        payment: paymentMethod,
        subtotal,
        tax_total: taxAmount,
        discount_total: discountAmount,
        total,
        notes: notes || null,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        signature_data: signature
      };

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      if (cart.length > 0) {
        const saleItems = cart.map(item => ({
          sale_id: sale.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_cost: item.product.unit_cost,
          tax_rate: item.product.tax_rate,
          discount: item.discount
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;

        // Create consignment settlement records for consignment products
        const consignmentItems = cart.filter(item => item.product.is_consignment);
        if (consignmentItems.length > 0) {
          const settlementRecords = consignmentItems.map(item => ({
            product_id: item.product.id,
            sale_id: sale.id,
            supplier_id: item.product.consignment_supplier_id,
            sale_price: item.unit_price * item.quantity,
            payout_amount: item.product.unit_cost * item.quantity,
            paid_at: null
          }));

          const { error: settlementError } = await supabase
            .from('consignment_settlements')
            .insert(settlementRecords);

          if (settlementError) throw settlementError;
        }
      }

      return { sale, items: cart, signature };
    },
    onSuccess: ({ sale, items, signature: sig }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['consignment-settlements'] });
      queryClient.invalidateQueries({ queryKey: ['consignment-products'] });
      
      // Store completed sale data for modal
      setCompletedSale({ 
        sale, 
        items: items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price
        })), 
        signature: sig
      });

      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerEmail('');
      setDiscount(0);
      setDiscountType('percentage');
      setNotes('');
      setSignature(null);
      setStaffMember('');

      // Show confirmation modal
      setShowConfirmationModal(true);
    },
    onError: (error) => {
      toast({
        title: "Sale failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  return (
    <AppLayout 
      title="Point of Sale"
      subtitle="Process sales transactions"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Product Search */}
          <div className="xl:col-span-1">
            <ProductSearch 
              onAddToCart={addToCart}
              cartItems={cart.map(item => ({ product_id: item.product.id, quantity: item.quantity }))}
            />
          </div>
          
          {/* Middle: Shopping Cart */}
          <div className="xl:col-span-1">
            <ShoppingCartComponent
              items={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              discount={discount}
              discountType={discountType}
            />
          </div>
          
          {/* Right: Checkout */}
          <div className="xl:col-span-1">
            <CheckoutForm
              items={cart}
              partExchanges={[]}
              discount={discount}
              discountType={discountType}
              onDiscountChange={setDiscount}
              onDiscountTypeChange={setDiscountType}
              customerName={customerName}
              onCustomerNameChange={setCustomerName}
              customerEmail={customerEmail}
              onCustomerEmailChange={setCustomerEmail}
              customerNotes={notes}
              onCustomerNotesChange={setNotes}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              onCompleteSale={() => completeSaleMutation.mutate()}
              isProcessing={completeSaleMutation.isPending}
              requiresOwnerApproval={false}
              signature={signature}
              onSignatureChange={setSignature}
              staffMember={staffMember}
              onStaffMemberChange={setStaffMember}
              staffMembers={settings.staffMembers || []}
            />
          </div>
        </div>

        {/* Modals */}
        {completedSale && (
          <SaleConfirmationModal
            isOpen={showConfirmationModal}
            onClose={() => {
              setShowConfirmationModal(false);
              setCompletedSale(null);
            }}
            sale={completedSale.sale}
            items={completedSale.items}
            partExchanges={[]}
            signature={completedSale.signature}
            onPrint={() => {}}
            onEmailReceipt={customerEmail ? () => {} : undefined}
            onDownloadPDF={() => {}}
          />
        )}
      </div>
    </AppLayout>
  );
}