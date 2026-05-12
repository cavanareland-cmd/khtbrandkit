// Edge Function: extract-template-brief
// Reads an uploaded template image and extracts a structured CONTENT BRIEF
// (headline, subheadline, package, date, price, cta, body, tone, media type)
// to pre-fill the Studio form so users can quickly create a new variation.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

interface Req { templateId: string }

const SYSTEM = `You are a senior creative director. Look at the uploaded marketing design (poster/flyer/brochure/social) and extract a CONTENT BRIEF in Bahasa Indonesia that another designer can use to recreate a NEW variation. Read all visible text via OCR (verbatim where useful), then summarize. Be concrete, no fluff.`;

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

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: [
            { type: "text", text: "Lakukan OCR pada gambar lalu hasilkan brief konten terstruktur untuk membuat variasi BARU dari desain ini. Isi semua field. Bila info tidak terlihat, buat saran wajar berdasarkan konteks visual." },
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
                title: { type: "string", description: "Judul / headline utama" },
                package_name: { type: "string", description: "Sub-headline atau nama paket" },
                departure_date: { type: "string", description: "Tanggal / detail jadwal jika ada" },
                price: { type: "string", description: "Harga / range harga" },
                duration: { type: "string", description: "Durasi (cth: 13 Hari)" },
                cta: { type: "string", description: "Call-to-action lengkap (cth: Hubungi 0811-...)" },
                additional_info: { type: "string", description: "Bullet/paragraf info tambahan: bonus, hotel, fasilitas, alamat, website. Pisah dengan newline." },
                tone: { type: "string", description: "Saran tone, salah satu: 'Tenang & Khidmat', 'Hangat & Kekeluargaan', 'Berkelas & Premium', 'Inspiratif & Memotivasi', 'Informatif & Jelas'" },
                media_type: { type: "string", enum: ["flyer", "poster", "brochure", "social_post", "story", "announcement"] },
                summary: { type: "string", description: "Ringkasan brief 1-2 kalimat untuk designer" },
                detected_text: { type: "string", description: "Semua teks mentah hasil OCR (verbatim, dipisah newline)" },
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

    return new Response(JSON.stringify({ success: true, brief }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-template-brief error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
