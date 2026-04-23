// Edge Function: analyze-template
// Analyzes an uploaded design template via Vision AI to extract layout,
// colors, typography hints, and detected element regions.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface AnalyzeRequest {
  templateId: string;
}

const SYSTEM = `You are a senior visual design analyst. You will receive a single design reference image (poster/flyer/social media creative) and must produce a structured analysis describing its visual composition. Be precise, concise, and objective. Use Bahasa Indonesia for descriptive fields. Coordinates are normalized 0-1 from the top-left of the image.`;

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

    const { templateId } = (await req.json()) as AnalyzeRequest;
    if (!templateId) {
      return new Response(JSON.stringify({ error: "Missing templateId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tpl, error: tplErr } = await supabase
      .from("templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();
    if (tplErr || !tpl) throw new Error("Template not found");

    await supabase.from("templates").update({ status: "analyzing" }).eq("id", templateId);

    const previewUrl = tpl.preview_url || tpl.file_url;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: "Analisis template desain berikut. Identifikasi layout, palet warna, tipografi, mood, dan posisi area teks/icon/logo." },
              { type: "image_url", image_url: { url: previewUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_design",
            description: "Return structured analysis of the reference design",
            parameters: {
              type: "object",
              properties: {
                layout: { type: "string", description: "Deskripsi singkat komposisi (e.g., 'Center-aligned hero dengan headline besar di tengah')" },
                mood: { type: "string", description: "Mood / atmosfer (e.g., 'elegan, hangat, premium')" },
                style: { type: "string", description: "Style visual (e.g., 'minimalist editorial', 'maximalist collage', 'photorealistic with overlay')" },
                dominant_colors: {
                  type: "array",
                  items: { type: "string" },
                  description: "5-7 warna dominan dalam HEX (#RRGGBB)",
                },
                typography: {
                  type: "object",
                  properties: {
                    headline_style: { type: "string" },
                    body_style: { type: "string" },
                  },
                  required: ["headline_style", "body_style"],
                  additionalProperties: false,
                },
                regions: {
                  type: "array",
                  description: "Area-area utama yang terdeteksi di template (background, headline, subheadline, body, cta, logo, icon, image)",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["background", "headline", "subheadline", "body", "cta", "logo", "icon", "image", "shape"] },
                      x: { type: "number" },
                      y: { type: "number" },
                      width: { type: "number" },
                      height: { type: "number" },
                      description: { type: "string" },
                    },
                    required: ["type", "x", "y", "width", "height", "description"],
                    additionalProperties: false,
                  },
                },
                visual_prompt_seed: {
                  type: "string",
                  description: "Prompt seed (tanpa text/wajah) untuk re-generate background bergaya serupa",
                },
              },
              required: ["layout", "mood", "style", "dominant_colors", "typography", "regions", "visual_prompt_seed"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_design" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI analyze error:", aiResp.status, t);
      await supabase.from("templates").update({ status: "failed" }).eq("id", templateId);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Coba lagi sebentar." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis. Tambah saldo." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const tool = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tool) throw new Error("No tool call");
    const analysis = JSON.parse(tool.function.arguments);

    await supabase.from("templates")
      .update({ status: "ready", analysis })
      .eq("id", templateId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-template error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
