import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerificationRequest {
  email: string;
  studentId?: string;
  studentName?: string;
  verifyCode?: string;
}

const verificationTtlMs = 10 * 60 * 1000;
const resendCooldownMs = 60 * 1000;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Read raw request body first so we can return helpful debug info on parse errors
    const rawBody = await req.text();
    let body: VerificationRequest = {} as VerificationRequest;
    try {
      body = rawBody ? JSON.parse(rawBody) : ({} as VerificationRequest);
    } catch (parseErr) {
      console.error('Failed to parse JSON body for send-verification-code:', parseErr, rawBody);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body', details: rawBody }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE");
    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase service role key is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (body.verifyCode) {
      const { data: existingCodes, error: lookupError } = await supabase
        .from("email_verification_codes")
        .select("id, code, expires_at, used_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1);

      if (lookupError || !existingCodes?.length) {
        return new Response(
          JSON.stringify({ error: "Verification code not found or expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const codeRecord = existingCodes[0];
      if (codeRecord.used_at) {
        return new Response(
          JSON.stringify({ error: "Verification code already used" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (new Date(codeRecord.expires_at).getTime() < Date.now()) {
        return new Response(
          JSON.stringify({ error: "Verification code expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (codeRecord.code !== body.verifyCode.trim()) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: markError } = await supabase
        .from("email_verification_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", codeRecord.id);

      if (markError) {
        return new Response(
          JSON.stringify({ error: "Failed to consume verification code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Email verified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailProvider = (Deno.env.get("EMAIL_PROVIDER") || "resend").toLowerCase();
    const sendGridApiKey = Deno.env.get("SENDGRID_API_KEY");
    const sendGridFromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@yourdomain.com";
    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN");
    const mailgunFromEmail = Deno.env.get("MAILGUN_FROM_EMAIL") || `noreply@${mailgunDomain || 'yourdomain.com'}`;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    if (emailProvider === "sendgrid" && !sendGridApiKey) {
      return new Response(
        JSON.stringify({ error: "SendGrid is not configured on the server", details: "SENDGRID_API_KEY is missing from the edge-function environment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (emailProvider === "mailgun" && (!mailgunApiKey || !mailgunDomain)) {
      return new Response(
        JSON.stringify({ error: "Mailgun is not configured on the server", details: "MAILGUN_API_KEY or MAILGUN_DOMAIN is missing from the edge-function environment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (emailProvider !== "sendgrid" && emailProvider !== "mailgun" && !resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Email provider is not configured on the server", details: "No supported email provider credentials are available" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: recentCodes, error: recentError } = await supabase
      .from("email_verification_codes")
      .select("created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!recentError && recentCodes?.length) {
      const lastSentAt = new Date(recentCodes[0].created_at).getTime();
      if (Date.now() - lastSentAt < resendCooldownMs) {
        return new Response(
          JSON.stringify({ error: "Please wait before requesting another code", cooldownSeconds: Math.ceil((resendCooldownMs - (Date.now() - lastSentAt)) / 1000) }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + verificationTtlMs).toISOString();

    const { error: insertError } = await supabase.from("email_verification_codes").insert({
      email,
      code,
      expires_at: expiresAt,
      used_at: null,
    });

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to store verification code", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-bottom: 12px;">HTU E-VOTING SYSTEM email verification</h2>
        <p style="font-size: 16px; color: #374151;">Hello${body.studentName ? ` ${body.studentName}` : ""},</p>
        <p style="font-size: 16px; color: #374151;">Use the following verification code to continue your registration:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 0.2em; margin: 20px 0; color: #111827;">${code}</div>
        <p style="font-size: 14px; color: #6b7280;">This code expires after one use in this session.</p>
      </div>
    `;

    let response: Response;

    if (emailProvider === "sendgrid") {
      response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sendGridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: sendGridFromEmail, name: "HTU E-VOTING SYSTEM" },
          subject: "Your HTU E-VOTING SYSTEM verification code",
          content: [{ type: "text/html", value: html }],
        }),
      });
    } else if (emailProvider === "mailgun") {
      response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
        body: new URLSearchParams({
          from: `HTU E-VOTING SYSTEM <${mailgunFromEmail}>`,
          to: email,
          subject: "Your HTU E-VOTING SYSTEM verification code",
          html,
        }),
      });
    } else {
      response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [email],
          subject: "Your HTU E-VOTING SYSTEM verification code",
          html,
        }),
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(
        JSON.stringify({ error: "Failed to send verification email", details: errorData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Verification email error", message);
    return new Response(
      JSON.stringify({ error: "Unexpected server error", details: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
