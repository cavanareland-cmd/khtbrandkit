import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  name: string;
  description?: string;
  kind?: string; // shape / pattern / accent / divider / badge / illustration / frame
  style?: string; // flat / line / duotone / gradient / textured
  transparent?: boolean;
  count?: number;
}

const KIND_PROMPT: Record<string, string> = {
  shape: "abstract decorative geometric shape, organic blob or arabesque ornament",
  pattern: "seamless repeating pattern tile, balanced rhythm, ornamental motif",
  accent: "small decorative vector accent, flourish, sparkle, swirl, dot cluster",
  divider: "horizontal divider ornament, calligraphic flourish, thin elegant separator",
  badge: "circular badge / stamp / seal with ornamental border, empty center",
  illustration: "minimal vector spot illustration, single subject, decorative",
  frame: "decorative frame / border ornament, empty center, ready to enclose content",
};

const STYLE_PROMPT: Record<string, string> = {
  flat: "flat vector, solid fills, crisp edges, no shadows",
  line: "line-art, 2px stroke, monoline, geometric, no fills",
  duotone: "duotone flat, two harmonious brand colors, modern",
  gradient: "subtle gradient fills aligned to brand palette, smooth, premium",
  textured: "subtle paper / grain texture, vintage-modern",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body?.name?.trim()) return json({ error: "name required" }, 400);
    const count = Math.min(Math.max(body.count ?? 1, 1), 4);
    const kind = body.kind || "accent";
    const style = body.style || "flat";
    const transparent = body.transparent !== false;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: brand } = await admin
      .from("brand_kit")
      .select("section,data")
      .in("section", ["color", "identity", "voice"]);

    const colors = (brand ?? []).filter((r) => r.section === "color").map((r) => r.data as Record<string, string>);
    const palette = colors.slice(0, 6).map((c) => `${c.name ?? ""} ${c.hex ?? ""}`.trim()).join(", ");
    const identity = (brand ?? []).filter((r) => r.section === "identity").map((r) => r.data as { key?: string; value?: string });
    const brandName = identity.find((i) => i.key === "brand_name")?.value || identity[0]?.value || "Brand";
    const tagline = identity.find((i) => i.key === "tagline")?.value || "";

    const bgPrompt = transparent
      ? "on a fully transparent background (no background color, no checkerboard), isolated subject"
      : "on a clean solid white background";

    const prompt = `Create a single ${STYLE_PROMPT[style] ?? STYLE_PROMPT.flat} ${KIND_PROMPT[kind] ?? KIND_PROMPT.accent} representing "${body.name}"${
      body.description ? ` (${body.description})` : ""
    }. Vector-like, crisp edges, no text, no photographic elements, no realistic textures. ${bgPrompt}. Color palette aligned to brand "${brandName}"${tagline ? ` — ${tagline}` : ""}: ${palette}. Square 1:1, suitable as a decorative graphic accent for marketing posters, social media, and brand collateral.`;

    const results: { name: string; description: string; image_url: string; kind: string; style: string }[] = [];

    for (let i = 0; i < count; i++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!aiResp.ok) {
        const t = await aiResp.text();
        if (aiResp.status === 429) return json({ error: "Rate limit. Coba lagi sebentar." }, 429);
        if (aiResp.status === 402) return json({ error: "Kredit AI habis. Tambahkan kredit di Workspace." }, 402);
        return json({ error: `AI gateway error ${aiResp.status}: ${t}` }, 500);
      }
      const data = await aiResp.json();
      const imgUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imgUrl) return json({ error: "No image returned" }, 500);
      const base64 = imgUrl.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const safe = body.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const path = `ai-graphics/${Date.now()}-${i}-${safe}.png`;
      const { error: upErr } = await admin.storage.from("brand-assets").upload(path, bytes, {
        contentType: "image/png", upsert: false,
      });
      if (upErr) return json({ error: "upload failed: " + upErr.message }, 500);
      const { data: pub } = admin.storage.from("brand-assets").getPublicUrl(path);
      results.push({
        name: body.name,
        description: body.description ?? "",
        image_url: pub.publicUrl,
        kind, style,
      });
    }

    return json({ success: true, graphics: results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
