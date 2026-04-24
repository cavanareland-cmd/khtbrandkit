// Edge Function: rewrite-text-layer
// Rewrites a single text layer based on user instruction + brand voice
// + optional knowledge sources (media_library extracted text).

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const BRAND = `Brand: PT Karin Hidayah Tour (KHT). Tone: tenang, hormat, amanah, hangat. Bahasa Indonesia baku tapi ramah. JANGAN clickbait, JANGAN agresif. Sertakan sentuhan Islami yang halus jika relevan (insya Allah, barakallah) tapi jangan berlebihan.`;

interface ReqBody {
  layerKind: "headline" | "subheadline" | "body" | "cta" | string;
  currentText: string;
  instruction: string;
  mediaIds?: string[];
  maxLength?: number;
}

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

    const { layerKind, currentText, instruction, mediaIds, maxLength } = await req.json() as ReqBody;
    if (!instruction || typeof instruction !== "string") {
      return new Response(JSON.stringify({ error: "Missing instruction" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let knowledge = "";
    if (mediaIds && mediaIds.length > 0) {
      const { data: medias } = await supabase
        .from("media_library")
        .select("name, extracted_text")
        .in("id", mediaIds)
        .eq("user_id", user.id);
      if (medias) {
        knowledge = medias
          .filter((m) => m.extracted_text)
          .map((m) => `--- BAHAN: ${m.name} ---\n${m.extracted_text}`)
          .join("\n\n");
      }
    }

    const lengthHint = maxLength
      ? `Maksimum ${maxLength} karakter.`
      : layerKind === "headline" ? "Maksimum 60 karakter, kuat & memorable."
      : layerKind === "subheadline" ? "Maksimum 80 karakter."
      : layerKind === "cta" ? "Maksimum 25 karakter, action-oriented."
      : "Maksimum 200 karakter.";

    const systemPrompt = `${BRAND}\n\nTugas: rewrite SATU layer text untuk material promo. Jenis layer: ${layerKind}. ${lengthHint} Output HANYA teks barunya, tanpa kutip, tanpa penjelasan.`;

    const userPrompt = [
      `TEKS SAAT INI: "${currentText || "(kosong)"}"`,
      "",
      `INSTRUKSI USER: ${instruction}`,
      knowledge ? `\n\nBAHAN REFERENSI:\n${knowledge}` : "",
      "",
      "Tulis ulang teks tersebut sekarang:",
    ].join("\n");

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
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
      const t = await aiResp.text();
      console.error("AI rewrite error", aiResp.status, t);
      throw new Error(`AI gateway ${aiResp.status}`);
    }

    const data = await aiResp.json();
    let newText: string = data.choices?.[0]?.message?.content?.trim() || "";
    // strip surrounding quotes if model added them
    newText = newText.replace(/^["'`]+|["'`]+$/g, "").trim();

    return new Response(JSON.stringify({ success: true, newText }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rewrite-text-layer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
