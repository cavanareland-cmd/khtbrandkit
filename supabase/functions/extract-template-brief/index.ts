// Edge Function: extract-template-brief
// Reads an uploaded template image, injects KHT Brand Kit context, and extracts
// a structured CONTENT BRIEF that pre-fills the Studio form. The brief is also
// saved into templates.analysis.extracted_brief for re-use in Admin/CMS.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface Req { templateId: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SRK);
    const { data: { user } } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { templateId } = (await req.json()) as Req;
    if (!templateId) return new Response(JSON.stringify({ error: "Missing templateId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: tpl, error } = await supabase.from("templates").select("*").eq("id", templateId).eq("user_id", user.id).single();
    if (error || !tpl) throw new Error("Template not found");
    const imageUrl = tpl.preview_url || tpl.file_url;
    if (!imageUrl) throw new Error("Template tidak punya preview image");

    // ── Brand Kit injection ────────────────────────────────────────────────
    const { data: bkRows } = await supabase
      .from("brand_kit")
      .select("section,key,data")
      .in("section", ["identity", "color", "voice_do", "voice_dont", "voice_personality"]);

    const identity: Record<string, string> = {};
    const colors: string[] = [];
    const voiceDo: string[] = [];
    const voiceDont: string[] = [];
    const personality: string[] = [];
    (bkRows || []).forEach((r) => {
      const d = r.data as Record<string, unknown>;
      if (r.section === "identity" && r.key) identity[r.key as string] = String(d.value ?? "");
      if (r.section === "color") colors.push(`${d.name} (${d.hex}, ${d.role})`);
      if (r.section === "voice_do") voiceDo.push(String(d.text ?? ""));
      if (r.section === "voice_dont") voiceDont.push(String(d.text ?? ""));
      if (r.section === "voice_personality") personality.push(`${d.title}: ${d.desc}`);
    });

    const brandContext = `BRAND: ${identity.brand_name_primary || "Karin Hidayah Tour"} (${identity.brand_name_secondary || "KHT"}) — ${identity.category_label || "Travel Umrah & Haji"}.
TAGLINE: ${identity.tagline || ""}
WARNA: ${colors.slice(0, 7).join("; ")}
KEPRIBADIAN: ${personality.join(" | ")}
BAHASA YANG DIPAKAI (DO): ${voiceDo.join(" / ")}
HINDARI (DON'T): ${voiceDont.join(" / ")}`;

    const SYSTEM = `You are a senior creative director for ${identity.brand_name_primary || "Karin Hidayah Tour"}. You will look at an uploaded marketing design and extract a CONTENT BRIEF in Bahasa Indonesia that another designer can use to recreate a NEW variation in our brand voice.

${brandContext}

RULES:
- OCR semua teks yang terlihat (verbatim) sebelum menyusun brief.
- Brief harus selaras dengan kepribadian brand di atas; gunakan bahasa "DO" dan jauhi gaya "DON'T".
- Bila info tidak terlihat di gambar, isi dengan saran wajar yang tetap konsisten dengan brand.
- Concrete, no fluff.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "text", text: "Lakukan OCR pada gambar lalu hasilkan brief konten terstruktur dalam brand voice di system prompt." },
            { type: "image_url", image_url: { url: imageUrl } },
          ] },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_brief",
            description: "Structured content brief from a marketing design",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                package_name: { type: "string" },
                departure_date: { type: "string" },
                price: { type: "string" },
                duration: { type: "string" },
                cta: { type: "string" },
                additional_info: { type: "string", description: "Bonus, fasilitas, hotel, alamat, website. Pisah newline." },
                tone: { type: "string", description: "Salah satu: 'Tenang & Khidmat', 'Hangat & Kekeluargaan', 'Berkelas & Premium', 'Inspiratif & Memotivasi', 'Informatif & Jelas'" },
                media_type: { type: "string", enum: ["flyer", "poster", "brochure", "social_post", "story", "announcement"] },
                summary: { type: "string", description: "Ringkasan brief 1-2 kalimat untuk designer" },
                detected_text: { type: "string", description: "Semua teks OCR mentah, dipisah newline" },
              },
              required: ["title", "package_name", "departure_date", "price", "duration", "cta", "additional_info", "tone", "media_type", "summary", "detected_text"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_brief" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("extract-brief AI error:", aiResp.status, t);
      if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Coba lagi sebentar." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Kredit AI habis." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const tool = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tool) throw new Error("No tool call");
    const brief = JSON.parse(tool.function.arguments);

    // Persist brief into templates.analysis.extracted_brief (merge)
    const prevAnalysis = (tpl.analysis as Record<string, unknown> | null) || {};
    const mergedAnalysis = { ...prevAnalysis, extracted_brief: { ...brief, extracted_at: new Date().toISOString() } };
    await supabase.from("templates").update({ analysis: mergedAnalysis }).eq("id", templateId);

    return new Response(JSON.stringify({ success: true, brief }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-template-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
