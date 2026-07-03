import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface FaceEnrollmentRequest {
  userId: string;
  imageBase64: string;
  profileImageUrl?: string;
  demo?: boolean;
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

    const body: FaceEnrollmentRequest = await req.json();
    const { userId, imageBase64, profileImageUrl, demo } = body;

    if (!userId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing userId or imageBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, is_face_enrolled")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user.is_face_enrolled) {
      return new Response(
        JSON.stringify({ error: "User already face enrolled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode base64 image
    const imageBuffer = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));

    // For Phase 1, we'll simulate face detection
    // In production, you would use DeepFace or a similar library
    // Here we're doing basic validation that the image exists and is reasonable size

    if (imageBuffer.length < 1000) {
      return new Response(
        JSON.stringify({ error: "Image too small. Please capture a clearer image." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (imageBuffer.length > 5000000) {
      return new Response(
        JSON.stringify({ error: "Image too large. Please try again." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to get a real embedding from Hugging Face inference API
    let embedding: number[] | null = null;
    let hfUsed = false;
    // Demo mode: if requested, generate deterministic embedding from userId
    if (demo) {
      try {
        const enc = new TextEncoder();
        const idBuf = enc.encode(userId);
        const hashBuffer = await crypto.subtle.digest("SHA-256", idBuf);
        const hashArray = new Uint8Array(hashBuffer);
        const demoPseudo = new Uint8Array(128);
        for (let i = 0; i < 128; i++) demoPseudo[i] = hashArray[i % 32];
        embedding = Array.from(demoPseudo);
        console.log('Enrollment demo mode: generated deterministic embedding from userId');
      } catch (e) {
        console.error('Enrollment demo generation error', e);
      }
    }
    try {
      const hfKey = Deno.env.get("HF_API_KEY");
      if (hfKey) {
        const hfResp = await fetch(
          "https://api-inference.huggingface.co/models/openai/clip-vit-base-patch32",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hfKey}`,
              "Content-Type": "application/octet-stream",
            },
            body: imageBuffer,
          },
        );

        if (!hfResp.ok) {
          const txt = await hfResp.text();
          console.error("Hugging Face inference failed", txt);
        } else {
          const hfData = await hfResp.json();
          // Expect hfData to be an array of numbers (embedding)
          if (Array.isArray(hfData) && hfData.length > 0) {
            embedding = hfData.map((v: any) => Number(v));
            hfUsed = true;
          }
        }
      }
    } catch (err) {
      console.error("Error calling HF inference:", err);
    }

    // Fallback: if HF not configured or failed, create deterministic pseudo-embedding
    if (!embedding) {
      const hashBuffer = await crypto.subtle.digest("SHA-256", imageBuffer);
      const hashArray = new Uint8Array(hashBuffer);
      const pseudo = new Uint8Array(128);
      for (let i = 0; i < 128; i++) pseudo[i] = hashArray[i % 32];
      embedding = Array.from(pseudo);
    }

    // Log debug info about embedding
    try {
      console.log('Enrollment: hfUsed=', hfUsed, 'embedding_len=', embedding.length, 'first_vals=', embedding.slice(0,6));
    } catch (e) {
      console.error('Enrollment logging error', e);
    }

    // Store the embedding (array of numbers), enrollment flag and profile image
    let updateError: any = null;
    if (demo) {
      // In demo mode avoid storing embedding or profile image — just mark enrolled
      const res = await supabase
        .from('users')
        .update({ is_face_enrolled: true })
        .eq('id', userId);
      updateError = res.error;
      console.log('Enrollment demo mode: updated is_face_enrolled only');
    } else {
      const res = await supabase
        .from("users")
        .update({
          face_embedding: embedding,
          is_face_enrolled: true,
        })
        .eq("id", userId);
      updateError = res.error;
    }

    if (updateError) {
      const details = (updateError && typeof updateError === 'object') ? updateError : { message: String(updateError) };
      try { console.error("Error updating user:", JSON.stringify(details)); } catch { console.error("Error updating user (non-serializable)"); }
      return new Response(
        JSON.stringify({ error: "Failed to store facial data", details }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch stored embedding to confirm
    try {
      const { data: storedUser } = await supabase
        .from('users')
        .select('face_embedding')
        .eq('id', userId)
        .maybeSingle();
      if (storedUser) {
        const stored = storedUser.face_embedding;
        const len = Array.isArray(stored) ? stored.length : (stored ? String(stored).length : 0);
        console.log('Enrollment stored embedding length:', len);
      }
    } catch (e) {
      console.error('Error fetching stored embedding after update:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Face enrollment completed successfully"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Face enrollment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
