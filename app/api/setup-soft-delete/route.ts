import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Add is_deleted column if it doesn't exist
    const { error: columnError } = await supabase.rpc("exec_sql", {
      sql_query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'is_deleted'
          ) THEN
            ALTER TABLE products ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
          END IF;
        END $$;
      `,
    })

    if (columnError) {
      return NextResponse.json({ error: columnError.message }, { status: 500 })
    }

    // Create soft delete function
    const { error: functionError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE OR REPLACE FUNCTION soft_delete_product(product_id UUID)
        RETURNS VOID AS $$
        BEGIN
          UPDATE products
          SET is_deleted = TRUE, is_active = FALSE
          WHERE id = product_id;
        END;
        $$ LANGUAGE plpgsql;
      `,
    })

    if (functionError) {
      return NextResponse.json({ error: functionError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Soft delete functionality set up successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

