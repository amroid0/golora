-- Add is_deleted column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE products ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create a function to soft delete products
CREATE OR REPLACE FUNCTION soft_delete_product(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET is_deleted = TRUE, is_active = FALSE
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

