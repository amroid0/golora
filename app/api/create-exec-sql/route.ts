import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // SQL to create the exec_sql function
    const sql = `
      CREATE OR REPLACE FUNCTION create_exec_sql_function()
      RETURNS void AS $$
      BEGIN
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS void AS $inner$
        BEGIN
          EXECUTE sql_query;
        END;
        $inner$ LANGUAGE plpgsql SECURITY DEFINER;
      END;
      $$ LANGUAGE plpgsql;
      
      SELECT create_exec_sql_function();
    `

    // Execute the SQL directly
    const { error } = await supabase.from("_temp_exec_sql").select().sql(sql)

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to create exec_sql function",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "exec_sql function created successfully",
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Operation failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

