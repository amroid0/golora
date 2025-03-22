-- Add sizes column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'sizes'
  ) THEN
    ALTER TABLE products ADD COLUMN sizes TEXT[] DEFAULT NULL;
  END IF;
END $$;

-- Add colors column to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'colors'
  ) THEN
    ALTER TABLE products ADD COLUMN colors JSONB DEFAULT NULL;
  END IF;
END $$;

-- Add size column to order_items table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'size'
  ) THEN
    ALTER TABLE order_items ADD COLUMN size TEXT DEFAULT NULL;
  END IF;
END $$;

-- Add color column to order_items table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'order_items' AND column_name = 'color'
  ) THEN
    ALTER TABLE order_items ADD COLUMN color JSONB DEFAULT NULL;
  END IF;
END $$;

