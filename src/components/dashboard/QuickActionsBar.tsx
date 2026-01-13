import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Repeat, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActionsBar() {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'New Sale',
      icon: ShoppingCart,
      onClick: () => navigate('/sales'),
      variant: 'default' as const,
    },
    {
      label: 'Add Product',
      icon: Plus,
      onClick: () => navigate('/products/add'),
      variant: 'outline' as const,
    },
    {
      label: 'Record Trade-In',
      icon: Repeat,
      onClick: () => navigate('/products/intake'),
      variant: 'outline' as const,
    },
    {
      label: 'Low Stock',
      icon: AlertTriangle,
      onClick: () => navigate('/products?stock=low'),
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.variant}
          size="sm"
          onClick={action.onClick}
          className="flex items-center gap-2"
        >
          <action.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{action.label}</span>
          <span className="sm:hidden">{action.label.split(' ')[0]}</span>
        </Button>
      ))}
    </div>
  );
}
