import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, FileImage, Trash2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TemplateRow {
  id: string;
  name: string;
  file_url: string;
  preview_url: string | null;
  file_type: string;
  original_format: string | null;
  status: string;
  analysis: Record<string, unknown> | null;
  created_at: string;
}

interface Props {
  selectedId: string | null;
  onSelect: (tpl: TemplateRow | null) => void;
}

const ACCEPT = ".png,.jpg,.jpeg,.webp,.pdf,.psd,.ai,application/pdf,image/*";

export default function TemplatePicker({ selectedId, onSelect }: Props) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setTemplates((data ?? []) as unknown as TemplateRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUpload = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Login dulu"); return; }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File terlalu besar (max 25MB)");
      return;
    }
    setUploading(true);

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const isPdf = file.type === "application/pdf" || ext === "pdf";
    const isPsdOrAi = ext === "psd" || ext === "ai";
    const isImage = file.type.startsWith("image/");

    if (!isPdf && !isImage && !isPsdOrAi) {
      toast.error("Format tidak didukung");
      setUploading(false);
      return;
    }

    try {
      // 1) upload original
      const filePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("templates")
        .upload(filePath, file, { upsert: false, contentType: file.type || "application/octet-stream" });
      if (upErr) throw upErr;
      const fileUrl = supabase.storage.from("templates").getPublicUrl(filePath).data.publicUrl;

      // 2) generate preview image (rasterize first page if PDF, else self for image)
      let previewUrl: string | null = null;
      if (isImage) {
        previewUrl = fileUrl;
      } else if (isPdf) {
        previewUrl = await rasterizePdfFirstPage(file, user.id);
      } else if (isPsdOrAi) {
        toast.warning("PSD/AI tidak bisa di-preview otomatis. Untuk hasil terbaik, export ke PNG/JPG/PDF dari software desain Anda.");
        previewUrl = null;
      }

      // 3) insert row
      const { data: row, error: insErr } = await supabase.from("templates").insert({
        user_id: user.id,
        name: file.name,
        file_url: fileUrl,
        preview_url: previewUrl,
        file_type: file.type || ext,
        original_format: ext,
        status: previewUrl ? "uploaded" : "needs_export",
      }).select("*").single();
      if (insErr) throw insErr;

      toast.success("Template diupload!");

      // 4) auto-analyze if we have a preview
      if (previewUrl && row) {
        await analyzeTemplate(row.id);
      }
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error("Upload gagal: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setUploading(false);
    }
  };

  const analyzeTemplate = async (id: string) => {
    setAnalyzingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Tidak ada session");
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-template`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ templateId: id }),
        },
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Analyze failed");
      toast.success("Template dianalisis AI ✨");
      await refresh();
    } catch (e) {
      toast.error("Gagal analisis: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus template ini?")) return;
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Template dihapus");
      if (selectedId === id) onSelect(null);
      refresh();
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Template Inspirasi</h3>
          <p className="text-xs text-muted-foreground">Upload referensi visual untuk AI</p>
        </div>
        <Label htmlFor="tpl-upload" className={cn(
          "cursor-pointer inline-flex items-center gap-1 px-3 py-2 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90",
          uploading && "opacity-50 pointer-events-none",
        )}>
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Upload
        </Label>
        <Input
          id="tpl-upload" type="file" accept={ACCEPT} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
        />
      </div>

      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded flex items-start gap-2">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5 text-accent-foreground" />
        Support: PNG, JPG, WEBP, PDF. Untuk PSD/AI, export dulu ke PNG/PDF dari Photoshop/Illustrator.
      </p>

      {loading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center border-2 border-dashed rounded">
          <FileImage className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Belum ada template. Upload referensi visual untuk mulai.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className={cn(
                "relative group cursor-pointer border-2 rounded overflow-hidden transition-all",
                selectedId === t.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
              )}
              onClick={() => onSelect(t)}
            >
              {t.preview_url ? (
                <img src={t.preview_url} alt={t.name} className="w-full h-24 object-cover" />
              ) : (
                <div className="w-full h-24 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                  <FileImage className="w-6 h-6" />
                </div>
              )}
              <div className="p-1 bg-background/95 text-xs truncate">{t.name}</div>
              <div className="absolute top-1 left-1 flex gap-1">
                {t.status === "ready" && <Badge variant="secondary" className="text-[9px] h-4 px-1"><Sparkles className="w-2 h-2 mr-0.5" />OK</Badge>}
                {t.status === "uploaded" && <Badge variant="outline" className="text-[9px] h-4 px-1">Belum analisis</Badge>}
                {t.status === "analyzing" && <Badge className="text-[9px] h-4 px-1"><Loader2 className="w-2 h-2 mr-0.5 animate-spin" />Analisis</Badge>}
                {t.status === "needs_export" && <Badge variant="destructive" className="text-[9px] h-4 px-1">Export dulu</Badge>}
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                {t.status !== "ready" && t.preview_url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); analyzeTemplate(t.id); }}
                    className="p-1 bg-background rounded shadow"
                    disabled={analyzingId === t.id}
                  >
                    {analyzingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                  className="p-1 bg-background rounded shadow text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// Rasterize PDF first page using pdfjs-dist (browser worker)
async function rasterizePdfFirstPage(file: File, userId: string): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    // Use bundled worker
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise;

    const blob: Blob | null = await new Promise(res => canvas.toBlob(b => res(b), "image/jpeg", 0.85));
    if (!blob) return null;

    const path = `${userId}/preview-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("templates").upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) { console.error(error); return null; }
    return supabase.storage.from("templates").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.error("PDF rasterize failed:", e);
    toast.error("Gagal preview PDF");
    return null;
  }
}
