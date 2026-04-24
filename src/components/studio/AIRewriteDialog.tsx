import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MediaLibrary from "./MediaLibrary";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentText: string;
  layerKind: string;
  onApply: (newText: string) => void;
}

const PRESETS = [
  "Buat lebih singkat dan kuat",
  "Tambahkan urgensi (limited seat)",
  "Ganti dengan paket Ramadhan 2026",
  "Bahasa lebih formal & islami",
  "Highlight harga & bonus",
];

export default function AIRewriteDialog({ open, onOpenChange, currentText, layerKind, onApply }: Props) {
  const [instruction, setInstruction] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  const layerLabel = layerKind === "headline" ? "Headline"
    : layerKind === "subheadline" ? "Sub-headline"
    : layerKind === "cta" ? "CTA / Tombol"
    : layerKind === "body" ? "Body Text" : "Text";

  const run = async () => {
    if (!instruction.trim()) {
      toast.error("Tulis instruksi dulu");
      return;
    }
    setLoading(true);
    setPreview("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Login dulu");
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewrite-text-layer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          layerKind,
          currentText,
          instruction,
          mediaIds,
        }),
      });
      const j = await resp.json();
      if (!resp.ok) throw new Error(j.error || "AI gagal");
      setPreview(j.newText);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (preview) {
      onApply(preview);
      toast.success("Teks diperbarui");
      onOpenChange(false);
      setInstruction("");
      setPreview("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Rewrite — {layerLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">Teks saat ini</Label>
            <div className="text-sm bg-muted p-2 rounded mt-1 max-h-20 overflow-y-auto">
              {currentText || <span className="text-muted-foreground italic">(kosong)</span>}
            </div>
          </div>

          <div>
            <Label className="text-xs">Instruksi untuk AI *</Label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Mis: Ganti dengan headline untuk paket Umrah Plus Turki, fokus pada kemewahan."
              className="mt-1"
              rows={3}
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant="outline"
                  className="h-6 text-xs"
                  onClick={() => setInstruction(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div className="border-t pt-3">
            <MediaLibrary selectedIds={mediaIds} onSelectionChange={setMediaIds} selectable />
            {mediaIds.length > 0 && (
              <p className="text-xs text-primary mt-1">{mediaIds.length} bahan dipilih sebagai konteks</p>
            )}
          </div>

          {preview && (
            <div className="border-2 border-primary/40 rounded-lg p-3 bg-primary/5">
              <Label className="text-xs text-primary">Hasil AI</Label>
              <p className="text-sm mt-1 whitespace-pre-wrap">{preview}</p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={run} disabled={loading}>
                  Generate Ulang
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          {!preview ? (
            <Button onClick={run} disabled={loading || !instruction.trim()}>
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Generate
            </Button>
          ) : (
            <Button onClick={apply}>Terapkan</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
