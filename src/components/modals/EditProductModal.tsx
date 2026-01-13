import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCreateProduct, useUpdateProduct, useDeleteProduct, useSuppliers, useStockAdjustment } from '@/hooks/useDatabase';
import { useLocations } from '@/hooks/useLocations';
import { useDocumentUpload } from '@/hooks/useProductDocuments';
import { useToast } from '@/hooks/use-toast';
import { Product, DocumentType } from '@/types';
import {
  Loader2,
  Save,
  Plus,
  Package,
  Users,
  Settings,
  PoundSterling,
  Archive,
  Image as ImageIcon,
  FileText,
  TrendingUp,
  User,
  Building2,
  Trash2,
  MapPin
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { DocumentUpload } from '@/components/ui/document-upload';
import { AddProductForm } from '@/components/forms/AddProductForm';
import { getCleanedDescription, extractIndividualSeller, cn, formatCurrency } from '@/lib/utils';

interface DocumentUploadItem {
  id: string;
  file: File;
  doc_type: DocumentType;
  title: string;
  note?: string;
  expires_at?: Date;
}

interface EditProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProductModal({ product, open, onOpenChange }: EditProductModalProps) {
  const { data: suppliers } = useSuppliers();
  const { data: locations } = useLocations();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const stockAdjustment = useStockAdjustment();
  const documentUpload = useDocumentUpload();
  const { toast } = useToast();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const isEditMode = !!product;
  
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    description: '',
    category: '',
    fabric: '',
    size: '',
    color: '',
    supplier_type: 'registered' as 'registered' | 'individual',
    supplier_id: '',
    individual_name: '',
    location_id: '',
    unit_cost: '',
    unit_price: '',
    reorder_threshold: '0',
    quantity: '',
    image_url: '',
    is_registered: false,
    registration_doc: '',
    is_consignment: false,
    consignment_supplier_id: null as number | null,
    consignment_terms: '',
    consignment_start_date: '',
    consignment_end_date: '',
    purchase_date: ''
  });
  
  const [documents, setDocuments] = useState<DocumentUploadItem[]>([]);
  const [images, setImages] = useState<string[]>([]);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      const isIndividual = !product.supplier_id && product.description?.includes('Individual:');
      const individualName = extractIndividualSeller(product.description);
      const cleanedDescription = getCleanedDescription(product.description);
      
      setFormData({
        name: product.name || '',
        barcode: (product as any).barcode || '',
        description: cleanedDescription || '',
        category: product.category || '',
        fabric: product.metal || '',
        size: product.karat || '',
        color: product.gemstone || '',
        supplier_type: isIndividual ? 'individual' : 'registered',
        supplier_id: product.supplier_id?.toString() || '',
        individual_name: individualName || '',
        location_id: (product as any).location_id?.toString() || '',
        unit_cost: product.unit_cost?.toString() || '',
        unit_price: product.unit_price?.toString() || '',
        reorder_threshold: (product as any).reorder_threshold?.toString() || '0',
        quantity: '',
        image_url: (product as any).image_url || '',
        is_registered: (product as any).is_registered || false,
        registration_doc: (product as any).registration_doc || '',
        is_consignment: (product as any).is_consignment || false,
        consignment_supplier_id: (product as any).consignment_supplier_id || null,
        consignment_terms: (product as any).consignment_terms || '',
        consignment_start_date: (product as any).consignment_start_date || '',
        consignment_end_date: (product as any).consignment_end_date || '',
        purchase_date: (product as any).purchase_date || ''
      });
      
      if ((product as any).image_url) {
        setImages([(product as any).image_url]);
      }
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        barcode: '',
        description: '',
        category: '',
        fabric: '',
        size: '',
        color: '',
        supplier_type: 'registered',
        supplier_id: '',
        individual_name: '',
        location_id: '',
        unit_cost: '',
        unit_price: '',
        reorder_threshold: '0',
        quantity: '1',
        image_url: '',
        is_registered: false,
        registration_doc: '',
        is_consignment: false,
        consignment_supplier_id: null,
        consignment_terms: '',
        consignment_start_date: '',
        consignment_end_date: '',
        purchase_date: ''
      });
      setDocuments([]);
      setImages([]);
    }
  }, [product, open]);

  const handleAddProductFormSubmit = async (formData: any, documents: any[], images: string[]) => {
    // Validate consignment fields if is_consignment is true
    if (formData.is_consignment && !formData.consignment_supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please select a consignment supplier when marking a product as consignment.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate supplier for non-trade-in products
    if (formData.supplier_type === 'registered' && !formData.supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create new product
      const hasRegistrationDoc = documents.some(doc => doc.doc_type === 'registration');
      
      const newProduct = await createProduct.mutateAsync({
        name: formData.name.trim(),
        barcode: formData.barcode.trim() || null,
        description: formData.supplier_type === 'individual' && formData.individual_name ?
          `Individual: ${formData.individual_name}${formData.description ? `\n${formData.description.trim()}` : ''}` :
          formData.description.trim() || null,
        category: formData.category || null,
        metal: formData.fabric?.trim() || null,
        karat: formData.size || null,
        gemstone: formData.color?.trim() || null,
        supplier_id: formData.supplier_type === 'registered' && formData.supplier_id ? parseInt(formData.supplier_id) : null,
        location_id: formData.location_id ? parseInt(formData.location_id) : null,
        unit_cost: parseFloat(formData.unit_cost) || 0,
        unit_price: parseFloat(formData.unit_price) || 0,
        reorder_threshold: parseInt(formData.reorder_threshold) || 0,
        image_url: images[0] || null, // Use first image as primary
        is_registered: hasRegistrationDoc || formData.is_registered,
        internal_sku: null, // This will be auto-generated by the database trigger
        is_consignment: formData.is_consignment,
        consignment_supplier_id: formData.is_consignment ? formData.consignment_supplier_id : null,
        consignment_start_date: formData.is_consignment ? formData.consignment_start_date || null : null,
        consignment_end_date: formData.is_consignment ? formData.consignment_end_date || null : null,
        consignment_terms: formData.is_consignment ? formData.consignment_terms || null : null
      });

      // Upload documents if any
      if (documents.length > 0) {
        for (const doc of documents) {
          await documentUpload.mutateAsync({
            productId: newProduct.id,
            file: doc.file,
            metadata: {
              doc_type: doc.doc_type,
              title: doc.title,
              note: doc.note,
              expires_at: doc.expires_at?.toISOString(),
            },
          });
        }
      }

      // Create initial stock if quantity is specified
      const quantity = parseInt(formData.quantity);
      if (quantity > 0) {
        await stockAdjustment.mutateAsync({
          product_id: newProduct.id,
          quantity: quantity,
          note: 'Initial stock from product creation'
        });
      }
      
      toast({
        title: "Success",
        description: "Product created successfully"
      });
      
      onOpenChange(false);
    } catch (error: any) {
      let errorMessage = "Failed to create product. Please try again.";
      
      // Check for duplicate constraint errors
      if (error?.code === '23505') {
        if (error?.message?.includes('barcode_key')) {
          errorMessage = "This barcode already exists in your inventory. Please use a different barcode or leave it empty.";
        } else if (error?.message?.includes('sku_key')) {
          errorMessage = "This SKU already exists. Please use a different SKU.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    
    try {
      await deleteProduct.mutateAsync(product.id);
      
      toast({
        title: "Success",
        description: "Product deleted successfully"
      });
      
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product. It may be associated with sales or other records.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate consignment dates
    if (formData.is_consignment && formData.consignment_start_date && formData.consignment_end_date &&
        formData.consignment_end_date < formData.consignment_start_date) {
      toast({
        title: "Validation Error",
        description: "Consignment end date must be after the start date.",
        variant: "destructive"
      });
      return;
    }

    // Validate consignment fields if is_consignment is true
    if (formData.is_consignment && !formData.consignment_supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please select a consignment supplier when marking a product as consignment.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate supplier
    if (formData.supplier_type === 'registered' && !formData.supplier_id) {
      toast({
        title: "Validation Error",
        description: "Please select a supplier.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (isEditMode && product) {
        // Update existing product
        await updateProduct.mutateAsync({
          id: product.id,
          updates: {
            name: formData.name.trim(),
            barcode: formData.barcode.trim() || null,
            description: formData.supplier_type === 'individual' && formData.individual_name ?
              `Individual: ${formData.individual_name}${formData.description ? `\n${formData.description.trim()}` : ''}` :
              formData.description.trim() || null,
            category: formData.category || null,
            metal: formData.fabric?.trim() || null,
            karat: formData.size || null,
            gemstone: formData.color?.trim() || null,
            supplier_id: formData.supplier_type === 'registered' && formData.supplier_id ? parseInt(formData.supplier_id) : null,
            location_id: formData.location_id ? parseInt(formData.location_id) : null,
            unit_cost: parseFloat(formData.unit_cost) || 0,
            unit_price: parseFloat(formData.unit_price) || 0,
            reorder_threshold: parseInt(formData.reorder_threshold) || 0,
            image_url: formData.image_url || null,
            is_registered: formData.is_registered,
            registration_doc: formData.registration_doc || null,
            is_consignment: formData.is_consignment,
            consignment_supplier_id: formData.is_consignment ? formData.consignment_supplier_id : null,
            consignment_start_date: formData.is_consignment ? formData.consignment_start_date || null : null,
            consignment_end_date: formData.is_consignment ? formData.consignment_end_date || null : null,
            consignment_terms: formData.is_consignment ? formData.consignment_terms || null : null,
            purchase_date: formData.purchase_date || null
          }
        });
        
        // Create stock adjustment if quantity is specified
        const quantity = parseInt(formData.quantity);
        if (quantity > 0) {
          await stockAdjustment.mutateAsync({
            product_id: product.id,
            quantity: quantity,
            note: 'Stock adjustment from product edit'
          });
        }
      }
      
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Use AddProductForm for new products
  if (!isEditMode) {
    const isLoading = createProduct.isPending || updateProduct.isPending || stockAdjustment.isPending || documentUpload.isPending;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 focus-within:ring-inset">
          <DialogHeader>
            <DialogTitle className="font-luxury text-lg sm:text-xl">Add New Product</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new product with complete details, images and documentation
            </DialogDescription>
          </DialogHeader>
          
          <AddProductForm 
            onSubmit={handleAddProductFormSubmit}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate profit and margin
  const profit = (Number(formData.unit_price) - Number(formData.unit_cost)) || 0;
  const margin = Number(formData.unit_price) > 0
    ? (((Number(formData.unit_price) - Number(formData.unit_cost)) / Number(formData.unit_price)) * 100)
    : 0;

  // Validate consignment dates
  const hasInvalidConsignmentDates = formData.is_consignment &&
    formData.consignment_start_date &&
    formData.consignment_end_date &&
    formData.consignment_end_date < formData.consignment_start_date;

  const isLoading = createProduct.isPending || updateProduct.isPending || stockAdjustment.isPending || documentUpload.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 focus-within:ring-inset">
        <DialogHeader className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="font-luxury text-xl sm:text-2xl truncate">{product.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  SKU: {(product as any).internal_sku}
                </span>
                {(product as any).barcode && (
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    SKU: {(product as any).barcode}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {(product as any).is_registered && (
                <Badge className="bg-primary text-primary-foreground text-xs">
                  Registered
                </Badge>
              )}
              {(product as any).is_consignment && (
                <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20 text-xs">
                  Consignment
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Accordion type="multiple" defaultValue={["ownership", "financials"]} className="w-full space-y-4">
            
            {/* Ownership Source Section */}
            <AccordionItem value="ownership" className="border border-border rounded-lg px-4 sm:px-8">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-luxury text-lg">Ownership Source</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6 px-1.5">
              {(product as any).is_consignment ? (
                  // Consignment Supplier Details
                  <div className="p-6 bg-warning/5 border border-warning/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <Building2 className="h-5 w-5 text-warning" />
                      <h4 className="font-luxury text-lg text-warning-foreground">Consignment Supplier</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Consignment Supplier *</Label>
                        <Select 
                          value={formData.consignment_supplier_id?.toString()} 
                          onValueChange={(value) => setFormData({...formData, consignment_supplier_id: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select consignment supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers?.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input 
                            type="date" 
                            value={formData.consignment_start_date}
                            onChange={(e) => setFormData({...formData, consignment_start_date: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={formData.consignment_end_date}
                            onChange={(e) => setFormData({...formData, consignment_end_date: e.target.value})}
                            min={formData.consignment_start_date || undefined}
                            className={hasInvalidConsignmentDates ? 'border-red-500' : ''}
                          />
                          {hasInvalidConsignmentDates && (
                            <p className="text-xs text-red-500">End date must be after start date</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Terms</Label>
                        <Input
                          placeholder="Commission %, return policy..."
                          value={formData.consignment_terms}
                          onChange={(e) => setFormData({...formData, consignment_terms: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Normal Product Supplier
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">Supplier Type</Label>
                      <RadioGroup 
                        value={formData.supplier_type} 
                        onValueChange={(value: 'registered' | 'individual') => 
                          setFormData({...formData, supplier_type: value, supplier_id: '', individual_name: ''})}
                        className="flex gap-8 mt-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="registered" id="registered" />
                          <Label htmlFor="registered" className="font-normal">Registered Supplier</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label htmlFor="individual" className="font-normal">Walk-in Customer</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {formData.supplier_type === 'registered' ? (
                      <Select value={formData.supplier_id} onValueChange={(value) => setFormData({...formData, supplier_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers?.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        placeholder="Customer name" 
                        value={formData.individual_name}
                        onChange={(e) => setFormData({...formData, individual_name: e.target.value})}
                      />
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Specifications */}
            <AccordionItem value="specifications" className="border border-border rounded-lg px-4 sm:px-8">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center space-x-3">
                  <Settings className="h-5 w-5 text-primary" />
                  <span className="font-luxury text-lg">Specifications</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6 px-1.5">
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary font-medium">Product Name *</Label>
                    <Input
                      id="name"
                      placeholder="Cotton Summer Dress..."
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="External barcode (optional)"
                      value={formData.barcode}
                      onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shirts">Shirts</SelectItem>
                        <SelectItem value="Pants">Pants</SelectItem>
                        <SelectItem value="Dresses">Dresses</SelectItem>
                        <SelectItem value="Jackets">Jackets</SelectItem>
                        <SelectItem value="Skirts">Skirts</SelectItem>
                        <SelectItem value="Coats">Coats</SelectItem>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="Shoes">Shoes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Fabric</Label>
                    <Input
                      placeholder="Cotton, Silk, Wool..."
                      value={formData.fabric}
                      onChange={(e) => setFormData({...formData, fabric: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={formData.size} onValueChange={(value) => setFormData({...formData, size: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                        <SelectItem value="XXL">XXL</SelectItem>
                        <SelectItem value="Free Size">Free Size</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Input
                      placeholder="Black, White, Red..."
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({...formData, purchase_date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Date this item was purchased or acquired
                  </p>
                </div>

                {locations && locations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <Label>Location</Label>
                    </div>
                    <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.filter(loc => loc.status === 'active').map((location) => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Detailed product description..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Financials */}
            <AccordionItem value="financials" className="border border-border rounded-lg px-4 sm:px-8">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center space-x-3">
                  <PoundSterling className="h-5 w-5 text-primary" />
                  <span className="font-luxury text-lg">Financials</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6 px-1.5">
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cost" className="text-primary font-medium">Cost Price *</Label>
                    <Input 
                      id="cost"
                      type="number"
                      step="0.01" min="0"
                      placeholder="0.00" 
                      value={formData.unit_cost}
                      onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                      required
                      className="focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-primary font-medium">Sell Price *</Label>
                    <Input 
                      id="price"
                      type="number"
                      step="0.01" min="0"
                      placeholder="0.00" 
                      value={formData.unit_price}
                      onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                      required
                      className="focus:border-primary"
                    />
                  </div>
                </div>
                
                {/* Profit Display */}
                {(formData.unit_cost || formData.unit_price) && (
                  <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className={cn(
                        "h-6 w-6",
                        profit >= 0 ? "text-green-600" : "text-red-500"
                      )} />
                      <div>
                        <p className="text-sm text-muted-foreground">Calculated Profit</p>
                        <p className={cn(
                          "font-luxury text-2xl font-semibold",
                          profit >= 0 ? "text-green-600" : "text-red-500"
                        )}>
                          £{profit.toFixed(2)} ({margin.toFixed(1)}% margin)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Stock Management */}
            <AccordionItem value="stock" className="border border-border rounded-lg px-4 sm:px-8">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center space-x-3">
                  <Archive className="h-5 w-5 text-primary" />
                  <span className="font-luxury text-lg">Stock Management</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6 px-1.5">
                <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Add Stock</Label>
                    <Input 
                      id="quantity"
                      type="number"
                      placeholder="0" 
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Adjust current inventory (+ to add, leave blank for no change)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reorder">Reorder Threshold</Label>
                    <Input
                      id="reorder"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.reorder_threshold}
                      onChange={(e) => setFormData({...formData, reorder_threshold: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Alert when stock falls below this level
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Documents & Media */}
            <AccordionItem value="media" className="border border-border rounded-lg px-4 sm:px-8">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center space-x-3">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <span className="font-luxury text-lg">Documents & Media</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4 pb-6 px-1.5">
                {/* Product Images */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Product Images</Label>
                  <ImageUpload 
                    value={formData.image_url} 
                    onChange={(url) => setFormData({...formData, image_url: url})}
                    onRemove={() => setFormData({...formData, image_url: ''})}
                  />
                </div>

                <Separator />

                {/* Registration Document */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Premium Item</Label>
                      <p className="text-sm text-muted-foreground">Enable for items with authenticity papers</p>
                    </div>
                    <Switch
                      checked={formData.is_registered}
                      onCheckedChange={(checked) => setFormData({...formData, is_registered: checked})}
                    />
                  </div>
                  
                  {formData.is_registered && (
                    <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
                      <Label className="text-sm font-medium">Registration Document</Label>
                      <DocumentUpload 
                        onChange={(url) => setFormData({...formData, registration_doc: url})}
                        onRemove={() => setFormData({...formData, registration_doc: ''})}
                      />
                      {formData.registration_doc && (
                        <p className="text-xs text-green-600 mt-1">Document uploaded successfully</p>
                      )}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading || deleteProduct.isPending}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading || deleteProduct.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || deleteProduct.isPending || hasInvalidConsignmentDates}
                className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </form>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete <strong>{product.name}</strong> (SKU: {(product as any).internal_sku})?
                <br /><br />
                This action cannot be undone. The product will be completely removed from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteProduct.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteProduct.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteProduct.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}