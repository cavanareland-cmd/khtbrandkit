import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, Brain, FileText, ImageIcon, RefreshCw } from "lucide-react";

export interface MediaItem {
  id: string;
  name: string;
  description: string | null;
  file_url: string;
  preview_url: string | null;
  file_type: string;
  original_format: string | null;
  status: string;
  extracted_text: string | null;
  tags: string[] | null;
  created_at: string;
}

interface Props {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  selectable?: boolean;
}

const ACCEPT = "image/*,application/pdf";

export default function MediaLibrary({ selectedIds, onSelectionChange, selectable = true }: Props) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal load pustaka media");
    } else {
      setItems((data || []) as MediaItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const extract = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-media`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ mediaId: id }),
    });
    if (!resp.ok) {
      const j = await resp.json().catch(() => ({}));
      toast.error(j.error || "Ekstraksi gagal");
    } else {
      toast.success("Konten berhasil diekstrak");
    }
    refresh();
  };

  const handleUpload = async (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File maksimum 25MB");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      toast.error("Format tidak didukung. Pakai image atau PDF.");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Login dulu");

      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("media-library")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const fileUrl = supabase.storage.from("media-library").getPublicUrl(path).data.publicUrl;

      let previewUrl: string | null = isImage ? fileUrl : null;
      if (isPdf) {
        previewUrl = await rasterizePdfFirstPage(file, user.id);
      }

      const { data: row, error: insErr } = await supabase.from("media_library").insert({
        user_id: user.id,
        name: file.name.replace(/\.[^.]+$/, ""),
        file_url: fileUrl,
        preview_url: previewUrl,
        file_type: file.type,
        original_format: ext,
        status: "uploaded",
      }).select().single();
      if (insErr) throw insErr;

      toast.success("Upload berhasil. AI sedang ekstrak konten…");
      await refresh();
      // auto extract
      extract(row.id);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("media_library").delete().eq("id", id);
    if (error) toast.error("Gagal hapus");
    else {
      onSelectionChange(selectedIds.filter((x) => x !== id));
      refresh();
    }
  };

  const toggle = (id: string) => {
    if (!selectable) return;
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter((x) => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Pustaka Media</h3>
          <p className="text-xs text-muted-foreground">Bahan referensi untuk AI (image/PDF). Diekstrak otomatis.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
            Upload Bahan
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
        </div>
      </div>

      <ScrollArea className="h-[280px] pr-2">
        {items.length === 0 && !loading && (
          <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
            Belum ada bahan. Upload brosur, foto paket, atau PDF itinerary.
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {items.map((m) => {
            const checked = selectedIds.includes(m.id);
            return (
              <Card
                key={m.id}
                className={`p-2 cursor-pointer transition border-2 ${checked ? "border-primary" : "border-transparent"}`}
                onClick={() => toggle(m.id)}
              >
                <div className="flex gap-2">
                  <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {m.preview_url ? (
                      <img src={m.preview_url} alt={m.name} className="w-full h-full object-cover" />
                    ) : m.file_type === "application/pdf" ? (
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1">
                      {selectable && <Checkbox checked={checked} onCheckedChange={() => toggle(m.id)} className="mt-0.5" />}
                      <p className="text-xs font-medium truncate flex-1">{m.name}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 mt-1.5">
                  {m.status !== "ready" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs px-1.5 flex-1"
                      onClick={(e) => { e.stopPropagation(); extract(m.id); }}
                    >
                      <Brain className="w-3 h-3 mr-1" /> Ekstrak
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs px-1.5 text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "ready" ? "default" : status === "extracting" ? "secondary" : status === "failed" ? "destructive" : "outline";
  const label = status === "ready" ? "✓ siap" : status === "extracting" ? "ekstrak…" : status === "failed" ? "gagal" : "raw";
  return <Badge variant={variant as any} className="text-[9px] h-4 px-1">{label}</Badge>;
}

async function rasterizePdfFirstPage(file: File, userId: string): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    // Bundled worker (no CDN dependency) so it also works on Vercel/offline hosts.
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.85)!);
    const path = `${userId}/preview-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("media-library").upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) return null;
    return supabase.storage.from("media-library").getPublicUrl(path).data.publicUrl;
  } catch (e) {
    console.warn("PDF rasterize failed", e);
    return null;
  }
}
