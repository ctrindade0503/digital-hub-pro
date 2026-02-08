import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin
    const adminClient = createClient(supabaseUrl, supabaseKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all table schemas from public schema
    const { data: tables, error: tablesError } = await adminClient.rpc("", {}).maybeSingle();
    
    // Use raw SQL via REST API
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    
    // Query information_schema for table/column definitions
    const { data: columns } = await adminClient
      .from("information_schema.columns" as any)
      .select("*")
      .eq("table_schema", "public");

    // Alternative: use pg_dump style query via SQL
    const sqlQuery = `
      SELECT 
        'CREATE TABLE public.' || quote_ident(t.table_name) || ' (' || E'\\n' ||
        string_agg(
          '  ' || quote_ident(c.column_name) || ' ' || 
          CASE 
            WHEN c.data_type = 'USER-DEFINED' THEN c.udt_name
            WHEN c.data_type = 'ARRAY' THEN c.udt_name
            ELSE c.data_type 
          END ||
          CASE WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')' ELSE '' END ||
          CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
          CASE WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default ELSE '' END,
          ',' || E'\\n'
          ORDER BY c.ordinal_position
        ) || E'\\n);' AS create_statement
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      ORDER BY t.table_name;
    `;

    // Execute via PostgREST RPC - we need a helper function
    // Instead, let's build SQL from information_schema via the REST API
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    // Simpler approach: query columns and build SQL in code
    const colRes = await fetch(
      `${supabaseUrl}/rest/v1/?select=*&limit=0`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      }
    );

    // Best approach: use the SQL endpoint directly
    const sqlRes = await fetch(`${supabaseUrl}/rest/v1/rpc/get_schema_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    // Since we can't easily run raw SQL, let's build the schema from what we know
    // Query each table's columns via information_schema

    return new Response(JSON.stringify({ error: "not implemented yet" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
