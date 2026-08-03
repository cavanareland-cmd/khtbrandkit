import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, LayoutTemplate, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { TemplateImage } from "@/components/studio/TemplateImage";

type TplBrief = {
  id: string;
  name: string;
  preview_url: string | null;
  brief: Record<string, string> | null;
  updated_at: string;
};
type CrBrief = {
  id: string;
  title: string;
  format: string;
  thumbnail_url: string | null;
  background_image_url: string | null;
  brief: Record<string, string> | null;
  updated_at: string;
};

export default function BriefsAdmin() {
  const [tpls, setTpls] = useState<TplBrief[]>([]);
  const [crs, setCrs] = useState<CrBrief[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: t }, { data: c }] = await Promise.all([
        supabase.from("templates").select("id,name,preview_url,analysis,updated_at").order("updated_at", { ascending: false }),
        supabase.from("creations").select("id,title,format,thumbnail_url,background_image_url,ai_brief,updated_at").order("updated_at", { ascending: false }),
      ]);
      setTpls(((t || []) as Array<Record<string, unknown>>)
        .map((r) => ({
          id: r.id as string,
          name: r.name as string,
          preview_url: (r.preview_url as string | null) ?? null,
          brief: (((r.analysis as Record<string, unknown>) || {}).extracted_brief as Record<string, string> | undefined) ?? null,
          updated_at: r.updated_at as string,
        }))
        .filter((r) => r.brief));
      setCrs(((c || []) as Array<Record<string, unknown>>)
        .map((r) => ({
          id: r.id as string,
          title: r.title as string,
          format: r.format as string,
          thumbnail_url: (r.thumbnail_url as string | null) ?? null,
          background_image_url: (r.background_image_url as string | null) ?? null,
          brief: (r.ai_brief as Record<string, string> | null) ?? null,
          updated_at: r.updated_at as string,
        }))
        .filter((r) => r.brief && Object.keys(r.brief!).length > 0));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <LayoutTemplate className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Brief dari Template</h2>
          <Badge variant="secondary">{tpls.length}</Badge>
        </div>
        {tpls.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada brief. Buka <Link to="/studio" className="underline">/studio</Link> → Mode Template → Extract Brief.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tpls.map((t) => <BriefCard key={t.id} thumb={t.preview_url} title={t.name} brief={t.brief!} updated={t.updated_at} />)}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl font-bold">Brief pada Karya Studio</h2>
          <Badge variant="secondary">{crs.length}</Badge>
        </div>
        {crs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada karya dengan brief tersimpan.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {crs.map((c) => (
              <BriefCard
                key={c.id}
                thumb={c.thumbnail_url || c.background_image_url}
                title={c.title}
                subtitle={c.format}
                brief={c.brief!}
                updated={c.updated_at}
                href={`/studio?id=${c.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BriefCard({ thumb, title, subtitle, brief, updated, href }: {
  thumb: string | null; title: string; subtitle?: string; brief: Record<string, string>; updated: string; href?: string;
}) {
  const fields: Array<[string, keyof typeof brief | string]> = [
    ["Headline", "title"], ["Sub / Paket", "package_name"], ["Tanggal", "departure_date"],
    ["Harga", "price"], ["Durasi", "duration"], ["CTA", "cta"], ["Tone", "tone"], ["Media", "media_type"],
  ];
  return (
    <Card className="p-4 space-y-3">
      <div className="flex gap-3">
        {thumb ? (
          <TemplateImage url={thumb} alt="" className="w-20 h-20 object-cover rounded border border-border shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded border border-border bg-muted flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{title}</p>
          {subtitle && <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{subtitle}</p>}
          <p className="text-[10px] text-muted-foreground mt-0.5">Updated {new Date(updated).toLocaleString("id-ID")}</p>
          {href && <Link to={href} className="text-[11px] text-primary hover:underline">Buka di Studio →</Link>}
        </div>
      </div>
      {brief.summary && (
        <p className="text-xs italic text-foreground/80 border-l-2 border-accent pl-2">{brief.summary}</p>
      )}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        {fields.map(([label, k]) => brief[k as string] ? (
          <div key={label} className="min-w-0">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="truncate">{brief[k as string]}</p>
          </div>
        ) : null)}
      </div>
      {brief.additional_info && (
        <details className="text-[11px]">
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">Info Tambahan</summary>
          <pre className="mt-1 p-2 bg-muted/40 rounded whitespace-pre-wrap font-mono text-[10px] max-h-32 overflow-auto">{brief.additional_info}</pre>
        </details>
      )}
      {brief.detected_text && (
        <details className="text-[11px]">
          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground">OCR Text</summary>
          <pre className="mt-1 p-2 bg-muted/40 rounded whitespace-pre-wrap font-mono text-[10px] max-h-40 overflow-auto">{brief.detected_text}</pre>
        </details>
      )}
    </Card>
  );
}
