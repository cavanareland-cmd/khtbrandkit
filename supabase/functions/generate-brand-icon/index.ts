import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  name: string;
  description?: string;
  style?: string; // line / filled / duotone
  count?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body?.name || body.name.trim().length < 1) {
      return json({ error: "name required" }, 400);
    }
    const count = Math.min(Math.max(body.count ?? 1, 1), 4);
    const style = body.style || "line";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Pull brand colors + identity for prompt context
    const { data: brand } = await admin
      .from("brand_kit")
      .select("section,data")
      .in("section", ["color", "identity"]);

    const colors = (brand ?? []).filter((r) => r.section === "color").map((r) => r.data as Record<string, string>);
    const palette = colors.slice(0, 5).map((c) => `${c.name} ${c.hex}`).join(", ");
    const brandName =
      ((brand ?? []).find((r) => r.section === "identity")?.data as { value?: string } | undefined)?.value ||
      "Brand";

    const stylePrompt: Record<string, string> = {
      line: "minimalist line-art icon, 2px stroke, geometric, flat",
      filled: "solid filled flat icon, simple silhouette, single color",
      duotone: "duotone flat icon, two harmonious colors, modern, clean",
    };

    const prompt = `Create a single ${stylePrompt[style] ?? stylePrompt.line} icon representing "${body.name}"${
      body.description ? ` (${body.description})` : ""
    }. Centered on a clean solid white background, generous padding, vector-like, crisp edges, no text, no shadows, no gradients beyond the duotone if applicable. Color palette aligned to brand "${brandName}": ${palette}. Square 1:1, suitable as a UI/brand icon.`;

    const results: { name: string; description: string; image_url: string }[] = [];

    for (let i = 0; i < count; i++) {
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!aiResp.ok) {
        const t = await aiResp.text();
        return json({ error: `AI gateway error ${aiResp.status}: ${t}` }, 500);
      }
      const data = await aiResp.json();
      const imgUrl: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imgUrl) {
        return json({ error: "No image returned from AI" }, 500);
      }
      // imgUrl is a data: URL
      const base64 = imgUrl.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const path = `ai-icons/${Date.now()}-${i}-${body.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.png`;
      const { error: upErr } = await admin.storage.from("brand-assets").upload(path, bytes, {
        contentType: "image/png",
        upsert: false,
      });
      if (upErr) return json({ error: "upload failed: " + upErr.message }, 500);
      const { data: pub } = admin.storage.from("brand-assets").getPublicUrl(path);
      results.push({
        name: body.name,
        description: body.description ?? "",
        image_url: pub.publicUrl,
      });
    }

    return json({ success: true, icons: results });
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
