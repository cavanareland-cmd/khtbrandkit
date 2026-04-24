// Edge Function: extract-media
// Extracts text + structured knowledge from an uploaded media file
// (image or PDF preview) using Vision AI. Stores result on media_library row.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const SYSTEM = `Anda adalah AI ekstraktor konten visual untuk agensi travel Umrah/Haji. Dari gambar/preview yang diberikan, ekstrak SEMUA informasi yang berguna sebagai bahan pembuatan konten iklan: teks yang terbaca (OCR), nama paket, harga, tanggal keberangkatan, fasilitas, hotel, durasi, kontak, USP, dll. Output dalam Bahasa Indonesia, terstruktur dan padat. Jika tidak ada informasi tertentu, lewati.`;

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

    const { mediaId } = await req.json();
    if (!mediaId) {
      return new Response(JSON.stringify({ error: "Missing mediaId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: media, error: mErr } = await supabase
      .from("media_library").select("*").eq("id", mediaId).eq("user_id", user.id).single();
    if (mErr || !media) throw new Error("Media not found");

    await supabase.from("media_library").update({ status: "extracting" }).eq("id", mediaId);

    const imgUrl = media.preview_url || media.file_url;

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
              { type: "text", text: "Ekstrak semua konten yang dapat dipakai sebagai bahan iklan dari media ini." },
              { type: "image_url", image_url: { url: imgUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_knowledge",
            description: "Return structured knowledge extracted from media",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Ringkasan 2-3 kalimat tentang isi media" },
                ocr_text: { type: "string", description: "Semua teks yang terlihat di media (verbatim)" },
                package_info: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    price: { type: "string" },
                    departure_date: { type: "string" },
                    duration: { type: "string" },
                    hotels: { type: "array", items: { type: "string" } },
                    facilities: { type: "array", items: { type: "string" } },
                    contact: { type: "string" },
                  },
                  additionalProperties: false,
                },
                key_selling_points: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" }, description: "3-6 tag pendek (e.g., 'umrah', 'ramadhan', 'plus-turki')" },
              },
              required: ["summary", "ocr_text", "key_selling_points", "tags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_knowledge" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI extract error:", aiResp.status, t);
      await supabase.from("media_library").update({ status: "failed" }).eq("id", mediaId);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Coba lagi sebentar." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Kredit AI habis." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const data = await aiResp.json();
    const tool = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tool) throw new Error("No tool call");
    const extracted = JSON.parse(tool.function.arguments);

    const fullText = [
      extracted.summary,
      "",
      "=== TEKS TERDETEKSI ===",
      extracted.ocr_text || "",
      "",
      "=== KEY POINTS ===",
      ...(extracted.key_selling_points || []).map((p: string) => `- ${p}`),
    ].join("\n");

    await supabase.from("media_library").update({
      status: "ready",
      extracted_text: fullText,
      extracted_meta: extracted,
      tags: extracted.tags || [],
    }).eq("id", mediaId);

    return new Response(JSON.stringify({ success: true, extracted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-media error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
