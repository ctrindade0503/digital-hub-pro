import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { email, password, makeAdmin } = await req.json();

  // Create user
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // If makeAdmin, add admin role
  if (makeAdmin && userData.user) {
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userData.user.id, role: "admin" },
      { onConflict: "user_id,role" }
    );
  }

  return new Response(JSON.stringify({ user: userData.user }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
