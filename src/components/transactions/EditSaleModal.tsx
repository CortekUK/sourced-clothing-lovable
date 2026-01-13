import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Loader2, Save } from 'lucide-react';
import { useUpdateSaleItem } from '@/hooks/useDatabase';
import { formatCurrency } from '@/lib/utils';

interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  product?: {
    name: string;
    internal_sku?: string;
  };
}

interface EditSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  items: SaleItem[];
  onSuccess?: () => void;
}

export function EditSaleModal({
  open,
  onOpenChange,
  saleId,
  items,
  onSuccess
}: EditSaleModalProps) {
  const [editedItems, setEditedItems] = useState<SaleItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [pendingSaves, setPendingSaves] = useState<Set<number>>(new Set());
  const updateSaleItem = useUpdateSaleItem();

  // Initialize edited items when modal opens
  useEffect(() => {
    if (open && items) {
      setEditedItems(items.map(item => ({ ...item })));
      setEditingItemId(null);
      setPendingSaves(new Set());
    }
  }, [open, items]);

  const handleItemChange = (itemId: number, field: keyof SaleItem, value: number) => {
    setEditedItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleSaveItem = async (item: SaleItem) => {
    const originalItem = items.find(i => i.id === item.id);
    if (!originalItem) return;

    // Check if anything actually changed
    const hasChanges =
      item.unit_price !== originalItem.unit_price ||
      item.quantity !== originalItem.quantity ||
      item.discount !== originalItem.discount;

    if (!hasChanges) {
      setEditingItemId(null);
      return;
    }

    setPendingSaves(prev => new Set(prev).add(item.id));

    try {
      await updateSaleItem.mutateAsync({
        saleItemId: item.id,
        saleId: item.sale_id,
        productId: item.product_id,
        updates: {
          unit_price: item.unit_price,
          quantity: item.quantity,
          discount: item.discount
        },
        originalQuantity: originalItem.quantity
      });

      setEditingItemId(null);
    } catch (error) {
      // Error handled by mutation
    } finally {
      setPendingSaves(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const calculateLineTotal = (item: SaleItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discounted = subtotal - (item.discount || 0);
    const tax = discounted * (item.tax_rate / 100);
    return discounted + tax;
  };

  const calculateTotal = () => {
    return editedItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const handleClose = () => {
    if (pendingSaves.size === 0) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Sale #{saleId}
          </DialogTitle>
          <DialogDescription>
            Click on an item to edit its price, quantity, or discount. Changes are saved individually.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-3">
            {editedItems.map((item) => {
              const isEditing = editingItemId === item.id;
              const isSaving = pendingSaves.has(item.id);
              const originalItem = items.find(i => i.id === item.id);
              const hasChanges = originalItem && (
                item.unit_price !== originalItem.unit_price ||
                item.quantity !== originalItem.quantity ||
                item.discount !== originalItem.discount
              );

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isEditing ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
                  }`}
                >
                  {/* Product Info */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{item.product?.name || 'Unknown Product'}</h4>
                      {item.product?.internal_sku && (
                        <p className="text-xs text-muted-foreground">SKU: {item.product.internal_sku}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(calculateLineTotal(item))}</p>
                      {item.tax_rate > 0 && (
                        <p className="text-xs text-muted-foreground">incl. {item.tax_rate}% tax</p>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    /* Edit Mode */
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unit Price (£)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Discount (£)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.discount || 0}
                          onChange={(e) => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="col-span-3 flex justify-end gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Reset to original values
                            if (originalItem) {
                              setEditedItems(prev => prev.map(i =>
                                i.id === item.id ? { ...originalItem } : i
                              ));
                            }
                            setEditingItemId(null);
                          }}
                          disabled={isSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveItem(item)}
                          disabled={isSaving || !hasChanges}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-3 w-3" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setEditingItemId(item.id)}
                    >
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity}</span>
                        <span>@ {formatCurrency(item.unit_price)}</span>
                        {item.discount > 0 && (
                          <span className="text-amber-600">-{formatCurrency(item.discount)} discount</span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>New Total:</span>
            <span className="text-primary">{formatCurrency(calculateTotal())}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Note: Totals will update in the system after saving changes to individual items.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} disabled={pendingSaves.size > 0}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
