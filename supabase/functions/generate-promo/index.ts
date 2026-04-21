// Edge Function: generate-promo
// Generates AI copy + design brief + background image for a promo creation

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const BRAND_SYSTEM = `You are the in-house brand copywriter & creative director for "PT Karin Hidayah Tour" (KHT) — an Indonesian Umrah & Hajj travel agency.

BRAND IDENTITY:
- Tagline: "Pelayanan Umrah Amanah & Nyaman"
- Personality: Amanah (trustworthy), Khidmat (devout), Profesional, Hangat
- Tone: Tenang, hormat, menenangkan. NEVER agresif, NEVER hard-sell, NEVER hiperbola/clickbait.
- Language: Bahasa Indonesia. Natural use of Islamic phrases (Bismillah, Insya Allah, Barakallah) when appropriate.
- Address jamaah respectfully: "Bapak/Ibu", "Tamu Allah".

BRAND COLORS:
- Primary: Maroon (#8E1428)
- Secondary: Navy (#101F4C)
- Accent: Gold (#C99A3F)
- Background: Ivory (#FBF8F3)

TYPOGRAPHY:
- Headings: Playfair Display (serif, elegant, bermartabat)
- Body: Inter or Montserrat (clean, modern)

DOS:
- Use phrases like "Mantapkan niat", "Insya Allah berkah", "Tamu Allah"
- Emphasize: Amanah, pendampingan penuh, fasilitas premium, izin resmi
DON'TS:
- "Promo gila!", "Murah meriah!", "Buruan beli!", excessive exclamation marks
- Comparing negatively to competitors
- All-caps spam`;

interface GenerateRequest {
  creationId: string;
  format: string;
  mediaType: string;
  inputData: {
    title: string;
    package_name?: string;
    departure_date?: string;
    price?: string;
    duration?: string;
    cta?: string;
    additional_info?: string;
    tone?: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Auth: validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: GenerateRequest = await req.json();
    const { creationId, format, mediaType, inputData } = body;

    if (!creationId || !format || !inputData) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as generating
    await supabase.from("creations").update({ status: "generating" }).eq("id", creationId).eq("user_id", user.id);

    // ===== STEP 1: Generate copy + brief via tool calling =====
    const userPrompt = `Buat konten promosi ${mediaType} untuk format ${format}.

Detail:
- Judul/Tema: ${inputData.title}
${inputData.package_name ? `- Nama Paket: ${inputData.package_name}` : ""}
${inputData.departure_date ? `- Tanggal Keberangkatan: ${inputData.departure_date}` : ""}
${inputData.price ? `- Harga: ${inputData.price}` : ""}
${inputData.duration ? `- Durasi: ${inputData.duration}` : ""}
${inputData.cta ? `- Call to Action: ${inputData.cta}` : ""}
${inputData.additional_info ? `- Info Tambahan: ${inputData.additional_info}` : ""}
${inputData.tone ? `- Tone Khusus: ${inputData.tone}` : ""}

Hasilkan copy yang singkat, elegan, sesuai brand voice KHT, dan deskripsi visual untuk gambar background.`;

    const copyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: BRAND_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_promo_content",
            description: "Generate complete promo content with copy and visual brief",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "Headline utama, singkat dan elegan (max 8 kata)" },
                subheadline: { type: "string", description: "Sub-headline pendukung (max 12 kata)" },
                body: { type: "string", description: "Deskripsi singkat 1-2 kalimat" },
                highlight: { type: "string", description: "Highlight utama (harga/tanggal/feature) - sangat singkat" },
                cta_text: { type: "string", description: "Tombol CTA (max 4 kata)" },
                hashtags: { type: "array", items: { type: "string" }, description: "5-8 hashtag relevan tanpa #" },
                caption_long: { type: "string", description: "Caption panjang untuk Instagram/WhatsApp (3-5 kalimat) dengan emoji secukupnya" },
                visual_prompt: {
                  type: "string",
                  description: "Prompt detail untuk image generator. Deskripsikan background image yang elegan dan respectful — Ka'bah, Masjidil Haram, Madinah, arsitektur Islamic, langit golden hour, ornamen geometric. JANGAN sertakan teks/wajah. Style: cinematic, photorealistic atau elegant illustration. Sesuai dengan tone brand maroon-navy-gold.",
                },
                color_suggestion: { type: "string", enum: ["primary", "secondary", "gold", "ivory"], description: "Warna dominan teks yang disarankan" },
              },
              required: ["headline", "subheadline", "body", "highlight", "cta_text", "hashtags", "caption_long", "visual_prompt", "color_suggestion"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_promo_content" } },
      }),
    });

    if (!copyResponse.ok) {
      const t = await copyResponse.text();
      console.error("AI copy error:", copyResponse.status, t);
      if (copyResponse.status === 429) {
        await supabase.from("creations").update({ status: "failed" }).eq("id", creationId);
        return new Response(JSON.stringify({ error: "Rate limit. Coba lagi sebentar." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (copyResponse.status === 402) {
        await supabase.from("creations").update({ status: "failed" }).eq("id", creationId);
        return new Response(JSON.stringify({ error: "Kredit AI habis. Tambah saldo di Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI copy gateway error ${copyResponse.status}`);
    }

    const copyData = await copyResponse.json();
    const toolCall = copyData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const aiContent = JSON.parse(toolCall.function.arguments);

    // ===== STEP 2: Generate background image =====
    const aspectMap: Record<string, string> = {
      a4_portrait: "portrait orientation 3:4 aspect ratio",
      instagram_post: "square 1:1 aspect ratio",
      instagram_story: "vertical 9:16 aspect ratio",
      banner_landscape: "wide landscape 16:9 aspect ratio",
    };

    const imagePrompt = `${aiContent.visual_prompt}. ${aspectMap[format] || "square"}. NO text, NO words, NO logos, NO faces. Elegant, professional, cinematic photography or refined Islamic illustration. Mood: serene, sacred, premium. Color palette compatible with maroon (#8E1428), navy (#101F4C), and gold (#C99A3F). Leave compositional space at top or bottom for text overlay.`;

    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const t = await imageResponse.text();
      console.error("Image gen error:", imageResponse.status, t);
      await supabase.from("creations").update({
        status: "ready",
        ai_copy: aiContent,
        ai_brief: { visual_prompt: aiContent.visual_prompt, error: "Image generation failed, copy ready" },
      }).eq("id", creationId);
      return new Response(JSON.stringify({
        success: true,
        partial: true,
        message: "Copy berhasil tapi image gagal generate. Anda bisa upload gambar manual.",
        ai_copy: aiContent,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image returned");

    // ===== STEP 3: Upload base64 image to storage =====
    const base64Match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image format");
    const mimeType = base64Match[1];
    const ext = mimeType.split("/")[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const filePath = `${user.id}/${creationId}/bg-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("creations")
      .upload(filePath, binaryData, { contentType: mimeType, upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload image");
    }

    const { data: { publicUrl } } = supabase.storage.from("creations").getPublicUrl(filePath);

    // ===== STEP 4: Save everything to DB =====
    await supabase.from("creations").update({
      status: "ready",
      ai_copy: aiContent,
      ai_brief: { visual_prompt: aiContent.visual_prompt, color_suggestion: aiContent.color_suggestion },
      background_image_url: publicUrl,
    }).eq("id", creationId).eq("user_id", user.id);

    return new Response(JSON.stringify({
      success: true,
      ai_copy: aiContent,
      background_image_url: publicUrl,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("generate-promo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
