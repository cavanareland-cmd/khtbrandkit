// Edge Function: generate-from-template
// Two modes:
//   - "inspiration" : generate brand-aligned image inspired by the template
//   - "extract"     : return scaffold of element layers using template analysis

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const BRAND_SYSTEM = `Brand: PT Karin Hidayah Tour (KHT) — Umrah & Hajj Indonesia.
Palette: Maroon #8E1428, Navy #101F4C, Gold #C99A3F, Ivory #FBF8F3.
Tone: Tenang, hormat, amanah. NEVER agresif/clickbait.
Fonts: Playfair Display (display), Inter (body).`;

interface ReqBody {
  creationId: string;
  templateId: string;
  format: string;
  mode: "inspiration" | "extract";
  inputData: {
    title: string;
    headline?: string;
    subheadline?: string;
    body?: string;
    cta?: string;
    package_name?: string;
    price?: string;
    departure_date?: string;
  };
}

const ASPECT: Record<string, string> = {
  a4_portrait: "3:4 portrait",
  instagram_post: "1:1 square",
  instagram_story: "9:16 vertical",
  banner_landscape: "16:9 landscape",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const body: ReqBody = await req.json();
    const { creationId, templateId, format, mode, inputData } = body;
    if (!creationId || !templateId || !format || !mode) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tpl } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();
    if (!tpl) throw new Error("Template not found");
    if (!tpl.analysis || Object.keys(tpl.analysis).length === 0) {
      throw new Error("Template belum dianalisis");
    }

    await supabase.from("creations").update({ status: "generating" }).eq("id", creationId).eq("user_id", user.id);

    const analysis = tpl.analysis as any;
    let backgroundUrl: string | null = null;
    let elements: any[] = [];

    // ===== Mode: inspiration → generate new branded background =====
    const visualPrompt = `${analysis.visual_prompt_seed || analysis.style}. Mood: ${analysis.mood}. Layout: ${analysis.layout}. ${ASPECT[format] || "1:1"}. Brand-aligned: maroon #8E1428, navy #101F4C, gold #C99A3F, ivory #FBF8F3. NO text, NO words, NO logos, NO faces. Elegant, cinematic, sacred mood. Leave space for text overlay.`;

    if (mode === "inspiration") {
      const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: `Generate background image inspired by this reference, restyled for KHT brand. ${visualPrompt}` },
                { type: "image_url", image_url: { url: tpl.preview_url || tpl.file_url } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!imgResp.ok) {
        if (imgResp.status === 429 || imgResp.status === 402) {
          await supabase.from("creations").update({ status: "failed" }).eq("id", creationId);
          return new Response(JSON.stringify({
            error: imgResp.status === 429 ? "Rate limit." : "Kredit AI habis.",
          }), { status: imgResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        throw new Error(`Image gen ${imgResp.status}`);
      }

      const imgData = await imgResp.json();
      const imageUrl = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("No image returned");

      const m = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!m) throw new Error("Invalid image format");
      const mimeType = m[1];
      const ext = mimeType.split("/")[1];
      const bin = Uint8Array.from(atob(m[2]), c => c.charCodeAt(0));
      const filePath = `${user.id}/${creationId}/tpl-bg-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("creations")
        .upload(filePath, bin, { contentType: mimeType, upsert: true });
      if (upErr) throw new Error("Upload failed");
      backgroundUrl = supabase.storage.from("creations").getPublicUrl(filePath).data.publicUrl;
    } else {
      // extract mode: use original template as background
      backgroundUrl = tpl.preview_url || tpl.file_url;
    }

    // ===== Build element layers from regions =====
    const regions = analysis.regions || [];
    const textMap: Record<string, string> = {
      headline: inputData.headline || inputData.title || "Headline",
      subheadline: inputData.subheadline || inputData.package_name || "",
      body: inputData.body || inputData.departure_date || "",
      cta: inputData.cta || "Hubungi Kami",
    };

    elements = regions
      .filter((r: any) => r.type !== "background")
      .map((r: any, i: number) => {
        const id = `el-${Date.now()}-${i}`;
        const base = {
          id,
          x: r.x ?? 0.1,
          y: r.y ?? 0.1,
          width: r.width ?? 0.4,
          height: r.height ?? 0.1,
          rotation: 0,
          locked: false,
          visible: true,
          opacity: 1,
        };
        if (["headline", "subheadline", "body", "cta"].includes(r.type)) {
          return {
            ...base,
            kind: "text",
            text: textMap[r.type] || r.description,
            fontFamily: r.type === "headline" || r.type === "subheadline" ? "display" : "body",
            fontSize: r.type === "headline" ? 8 : r.type === "subheadline" ? 5 : r.type === "cta" ? 4 : 3,
            color: r.type === "cta" ? "#FBF8F3" : "#101F4C",
            bold: r.type === "headline" || r.type === "cta",
            italic: false,
            align: "center",
            lineHeight: 1.2,
            bgColor: r.type === "cta" ? "#8E1428" : undefined,
            bgOpacity: r.type === "cta" ? 1 : 0,
          };
        }
        if (r.type === "logo") {
          return { ...base, kind: "logo" };
        }
        if (r.type === "icon") {
          return { ...base, kind: "icon", iconName: "star", color: "#C99A3F" };
        }
        if (r.type === "shape") {
          return { ...base, kind: "shape", shape: "rect", color: "#8E1428", bgOpacity: 0.8 };
        }
        // image placeholder
        return { ...base, kind: "image", imageUrl: null };
      });

    await supabase.from("creations").update({
      status: "ready",
      background_image_url: backgroundUrl,
      template_id: templateId,
      elements,
      ai_brief: { template_analysis: analysis, mode },
    }).eq("id", creationId).eq("user_id", user.id);

    return new Response(JSON.stringify({
      success: true,
      background_image_url: backgroundUrl,
      elements,
      analysis,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("generate-from-template error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
