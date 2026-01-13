import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useVoidSale } from '@/hooks/useDatabase';
import { formatCurrency } from '@/lib/utils';

interface VoidSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  saleTotal: number;
  itemCount: number;
  onSuccess?: () => void;
}

export function VoidSaleModal({
  open,
  onOpenChange,
  saleId,
  saleTotal,
  itemCount,
  onSuccess
}: VoidSaleModalProps) {
  const [reason, setReason] = useState('');
  const voidSale = useVoidSale();

  const handleVoid = async () => {
    if (!reason.trim()) return;

    try {
      await voidSale.mutateAsync({ saleId, reason: reason.trim() });
      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClose = () => {
    if (!voidSale.isPending) {
      setReason('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Void Sale #{saleId}
          </DialogTitle>
          <DialogDescription>
            This action will cancel the sale and return all items to inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sale Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sale Total:</span>
              <span className="font-semibold">{formatCurrency(saleTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items to Return:</span>
              <span className="font-semibold">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> This cannot be undone. All stock will be returned to inventory.
            </p>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="void-reason">
              Reason for voiding <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="void-reason"
              placeholder="Enter the reason for voiding this sale (e.g., wrong price entered, customer changed mind, duplicate entry)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={voidSale.isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={voidSale.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleVoid}
            disabled={!reason.trim() || voidSale.isPending}
          >
            {voidSale.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Voiding...
              </>
            ) : (
              'Void Sale'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
