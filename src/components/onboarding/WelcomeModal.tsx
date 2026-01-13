import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Sparkles, 
  ShoppingCart, 
  Package, 
  PoundSterling, 
  BarChart3, 
  Settings,
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const features = [
  {
    icon: ShoppingCart,
    title: 'Point of Sale',
    description: 'Fast checkout with part-exchange support & receipt printing'
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock, consignments & trade-ins'
  },
  {
    icon: PoundSterling,
    title: 'Expense Tracking',
    description: 'Record and categorise business expenses'
  },
  {
    icon: BarChart3,
    title: 'Reports & Analytics',
    description: 'Clear profit & loss, sales trends, supplier insights'
  },
  {
    icon: Settings,
    title: 'Settings & Preferences',
    description: 'Configure business details, tax rates, and currency'
  }
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);
  const { user, userRole } = useAuth();

  useEffect(() => {
    // Only show welcome modal on actual login, not tab return
    const hasSeenWelcome = localStorage.getItem('jc_welcome_seen');
    const neverShow = localStorage.getItem('jc_welcome_never_show') === 'true';
    
    if (hasSeenWelcome || neverShow) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only show on SIGNED_IN event (actual login), not on initial session restore
        if (event === 'SIGNED_IN' && session?.user) {
          setOpen(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleClose = () => {
    if (neverShowAgain) {
      localStorage.setItem('jc_welcome_never_show', 'true');
    } else {
      localStorage.setItem('jc_welcome_seen', 'true');
    }
    setOpen(false);
  };

  if (step === 0) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span>👋 Welcome to Fashion Store CRM</span>
            </DialogTitle>
            <DialogDescription className="text-sm">
              A complete POS and inventory management system designed for clothing retailers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2 sm:gap-3 max-h-[50vh] overflow-y-auto">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-2 sm:p-3 rounded-lg bg-muted/30">
                  <feature.icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>


            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="never-show"
                checked={neverShowAgain}
                onCheckedChange={(checked) => setNeverShowAgain(checked === true)}
                className="mt-0.5"
              />
              <label
                htmlFor="never-show"
                className="text-sm text-muted-foreground cursor-pointer leading-tight"
              >
                Don't show this welcome message again
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => setStep(1)} className="w-full">
                Get Started
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
            <span>🚀 Quick Start Guide</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Follow these steps to get your store up and running
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="p-3 sm:pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs flex-shrink-0">1</span>
                Add Your Products
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Upload shirts, dresses, or other clothing items to your inventory
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs flex-shrink-0">2</span>
                Configure Settings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Set up tax rates, supplier details, and consignment rules
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="p-3 sm:pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs flex-shrink-0">3</span>
                Make Your First Sale
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Use POS to process a transaction or part-exchange
              </CardDescription>
            </CardHeader>
          </Card>

          <Button onClick={handleClose} className="w-full">
            ✨ Start Using Your CRM
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}