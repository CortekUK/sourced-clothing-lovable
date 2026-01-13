import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import { FinancialTab } from '@/components/reports/FinancialTab';
import { ProductsTab } from '@/components/reports/ProductsTab';
import { SuppliersTab } from '@/components/reports/SuppliersTab';
import { PxConsignmentTab } from '@/components/reports/PxConsignmentTab';
import { BarChart3, Building2, PoundSterling, Package } from 'lucide-react';

export default function ConsolidatedReports() {
  const [activeTab, setActiveTab] = useState('financial');

  return (
    <AppLayout 
      title="Reports"
      subtitle="Comprehensive financial reporting and business analytics"
    >
      <div className="space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="financial" className="flex items-center gap-2 py-2">
              <PoundSterling className="h-4 w-4" />
              <span className="hidden sm:inline">Financial</span>
              <span className="sm:hidden">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2 py-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2 py-2">
              <Building2 className="h-4 w-4" />
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="px-consignment" className="flex items-center gap-2 py-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">PX & Consignment</span>
              <span className="sm:hidden">PX</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial">
            <FinancialTab />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="suppliers">
            <SuppliersTab />
          </TabsContent>

          <TabsContent value="px-consignment">
            <PxConsignmentTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}