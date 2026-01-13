-- Update SKU format to numbers only (remove LIT- prefix)

-- Update the SKU generation function to use numbers only
CREATE OR REPLACE FUNCTION public.gen_internal_sku()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF new.internal_sku IS NULL THEN
    new.internal_sku := lpad(nextval('product_sku_seq')::text, 5, '0');
  END IF;
  RETURN new;
END $$;

-- Update existing SKUs to remove the LIT- prefix
UPDATE public.products
SET internal_sku = regexp_replace(internal_sku, '^LIT-', '')
WHERE internal_sku LIKE 'LIT-%';
