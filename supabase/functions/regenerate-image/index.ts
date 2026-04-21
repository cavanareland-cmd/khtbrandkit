// Edge Function: regenerate-image
// Regenerates only the background image with custom or refined prompt

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { creationId, prompt, format } = await req.json();
    if (!creationId || !prompt) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aspectMap: Record<string, string> = {
      a4_portrait: "portrait 3:4",
      instagram_post: "square 1:1",
      instagram_story: "vertical 9:16",
      banner_landscape: "landscape 16:9",
    };

    const fullPrompt = `${prompt}. ${aspectMap[format] || "square 1:1"} aspect ratio. NO text, NO words, NO logos, NO faces. Elegant, photographic or refined illustration. Color compatible with maroon, navy, gold palette. Leave breathing space for text overlay. Premium, sacred, serene mood for Umrah/Hajj travel agency.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: fullPrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, coba lagi sebentar." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Image gen failed ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image returned");

    const base64Match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image format");
    const mimeType = base64Match[1];
    const ext = mimeType.split("/")[1];
    const binaryData = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));

    const filePath = `${user.id}/${creationId}/bg-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("creations")
      .upload(filePath, binaryData, { contentType: mimeType, upsert: true });

    if (uploadError) throw new Error("Upload failed");
    const { data: { publicUrl } } = supabase.storage.from("creations").getPublicUrl(filePath);

    await supabase.from("creations")
      .update({ background_image_url: publicUrl })
      .eq("id", creationId).eq("user_id", user.id);

    return new Response(JSON.stringify({ success: true, background_image_url: publicUrl }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
