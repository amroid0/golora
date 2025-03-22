-- Create the products bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the products bucket
-- Allow public read access to all files in the bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Public Read Access for products'
  ) THEN
    CREATE POLICY "Public Read Access for products"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'products');
  END IF;
END $$;

-- Allow authenticated users to upload files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Authenticated Users Can Upload to products'
  ) THEN
    CREATE POLICY "Authenticated Users Can Upload to products"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'products');
  END IF;
END $$;

-- Allow authenticated users to update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Authenticated Users Can Update Own Files in products'
  ) THEN
    CREATE POLICY "Authenticated Users Can Update Own Files in products"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'products' AND owner = auth.uid())
    WITH CHECK (bucket_id = 'products' AND owner = auth.uid());
  END IF;
END $$;

-- Allow authenticated users to delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Authenticated Users Can Delete Own Files in products'
  ) THEN
    CREATE POLICY "Authenticated Users Can Delete Own Files in products"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'products' AND owner = auth.uid());
  END IF;
END $$;

