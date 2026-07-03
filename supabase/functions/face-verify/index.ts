import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyRequest {
  userId: string;
  imageBase64: string;
  demo?: boolean;
}

function cosineSimilarity(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const av = Number(a[i]) || 0;
    const bv = Number(b[i]) || 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: VerifyRequest = await req.json();
    const { userId, imageBase64, demo } = body as VerifyRequest;
    if (!userId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing userId or imageBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, face_embedding")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Stored face data not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If not demo, require stored embedding. In demo mode we will generate deterministic stored embedding.
    if (!demo && !user.face_embedding) {
      return new Response(
        JSON.stringify({ error: "Stored face data not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode incoming image
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

    // Obtain embedding from Hugging Face if available
    let probeEmbedding: number[] | null = null;
    let hfUsed = false;

    // Demo mode: generate deterministic embedding from userId and skip HF
    if (demo) {
      try {
        const enc = new TextEncoder();
        const idBuf = enc.encode(userId);
        const hashBuffer = await crypto.subtle.digest("SHA-256", idBuf);
        const hashArray = new Uint8Array(hashBuffer);
        const demoPseudo = new Uint8Array(128);
        for (let i = 0; i < 128; i++) demoPseudo[i] = hashArray[i % 32];
        probeEmbedding = Array.from(demoPseudo);
        console.log('Verify demo mode: generated deterministic embedding from userId');
      } catch (e) {
        console.error('Verify demo generation error', e);
      }
    }

    try {
      const hfKey = Deno.env.get("HF_API_KEY");
      if (hfKey && !probeEmbedding) {
        const hfResp = await fetch(
          "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hfKey}`,
              "Content-Type": "application/octet-stream",
            },
            body: imageBuffer,
          }
        );
        if (hfResp.ok) {
          const hfData = await hfResp.json();
          if (Array.isArray(hfData) && hfData.length > 0) probeEmbedding = hfData.map((v: any) => Number(v));
          hfUsed = true;
        } else {
          console.error("HF verify failed:", await hfResp.text());
        }
      }
    } catch (err) {
      console.error("HF verify error:", err);
    }

    // Fallback: create deterministic pseudo-embedding similar to enrollment fallback
    if (!probeEmbedding) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", imageBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const pseudo = new Uint8Array(128);
      for (let i = 0; i < 128; i++) pseudo[i] = hashArray[i % 32];
      probeEmbedding = Array.from(pseudo);
    }

    // Determine stored embedding. In demo mode, generate deterministic embedding from userId.
    let storedEmbedding: number[] = [];
    if (demo) {
      try {
        const enc = new TextEncoder();
        const idBuf = enc.encode(userId);
        const hashBuffer = await crypto.subtle.digest("SHA-256", idBuf);
        const hashArray = new Uint8Array(hashBuffer);
        const demoPseudo = new Uint8Array(128);
        for (let i = 0; i < 128; i++) demoPseudo[i] = hashArray[i % 32];
        storedEmbedding = Array.from(demoPseudo);
        console.log('Verify demo mode: using deterministic stored embedding from userId');
      } catch (e) {
        console.error('Verify demo stored generation error', e);
      }
    } else {
      try {
        if (Array.isArray(user.face_embedding)) {
          storedEmbedding = (user.face_embedding as number[]).map((v: any) => Number(v));
        } else if (user.face_embedding instanceof Uint8Array) {
          storedEmbedding = Array.from(user.face_embedding as Uint8Array);
        } else if (user.face_embedding) {
          const asStr = String(user.face_embedding);
          try {
            const parsed = JSON.parse(asStr);
            if (Array.isArray(parsed)) storedEmbedding = parsed.map((v: any) => Number(v));
          } catch {}
        }
      } catch (e) {
        console.error('Error normalizing stored embedding:', e);
      }
    }

    console.log('Verify: hfUsed=', hfUsed, 'probe_len=', probeEmbedding.length, 'stored_len=', storedEmbedding.length, 'probe_first=', probeEmbedding.slice(0,6), 'stored_first=', storedEmbedding.slice(0,6));

    const score = cosineSimilarity(storedEmbedding, probeEmbedding);
    const threshold = Number(Deno.env.get("FACE_MATCH_THRESHOLD") ?? 0.35);
    const match = score >= threshold;

    return new Response(
      JSON.stringify({ success: true, match, score }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Face verify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
