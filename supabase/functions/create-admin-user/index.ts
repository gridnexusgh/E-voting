import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Body = {
  email: string;
  password: string;
  full_name: string;
  role: 'election_officer' | 'auditor';
  username?: string;
  scope: 'university' | 'faculty' | 'department';
  faculty_id?: string | null;
  department_id?: string | null;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    let body: Partial<Body> = {};
    try {
      body = (await req.json()) as Partial<Body>;
    } catch {
      const rawBody = await req.text();
      if (rawBody) {
        try {
          body = JSON.parse(rawBody) as Partial<Body>;
        } catch {
          body = {};
        }
      }
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const full_name = body.full_name?.trim();
    const role = body.role;
    const scope = body.scope || 'university';

    if (!email || !email.includes("@") || !password || !full_name || !role || !scope) {
      return new Response(
        JSON.stringify({ error: "Email, password, full name, role, and scope are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE") ?? "";

    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase service role key is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name,
        username: body.username || null,
        scope,
        faculty_id: body.faculty_id || null,
        department_id: body.department_id || null,
      },
    });

    if (createError || !data?.user) {
      const details = createError?.message || "Failed to create auth user";
      console.error("create-admin-user auth error", details, createError);
      return new Response(
        JSON.stringify({ error: details, details }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const authUser = data.user;
    const insertPayload = {
      id: authUser.id,
      email,
      password_hash: '',
      role,
      full_name,
      username: body.username || null,
      scope,
      faculty_id: scope === 'university' ? null : body.faculty_id || null,
      department_id: scope === 'department' ? body.department_id || null : null,
      is_email_verified: true,
      is_face_enrolled: false,
      is_active: true,
    };

    const { error: insertError } = await supabase.from('users').insert(insertPayload);
    if (insertError) {
      console.error("create-admin-user profile insert error", insertError);
      await supabase.auth.admin.deleteUser(authUser.id);
      return new Response(
        JSON.stringify({ error: insertError.message || 'Created auth user but failed to create profile. Please try again.', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, userId: authUser.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Create admin user error', message);
    return new Response(
      JSON.stringify({ error: 'Unexpected server error', details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
