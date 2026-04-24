import { useMemo, useState } from "react";
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

type PresetGroup = {
  label: string;
  items: { text: string; prompt: string }[];
};

// Preset umum (selalu muncul untuk semua layer)
const TONE_PRESETS: PresetGroup = {
  label: "Tone & Rasa",
  items: [
    { text: "Buat lebih amanah", prompt: "Tulis ulang dengan nuansa amanah, tenang, dan terpercaya. Hindari kata-kata berlebihan." },
    { text: "Buat lebih elegan", prompt: "Tulis ulang dengan gaya elegan, premium, dan berkelas. Pilih diksi yang halus." },
    { text: "Lebih hangat & personal", prompt: "Buat lebih hangat, ramah, dan terasa berbicara langsung kepada calon jamaah." },
    { text: "Lebih islami (halus)", prompt: "Sisipkan sentuhan islami yang halus seperti 'insya Allah' atau 'barakallah' bila relevan, jangan berlebihan." },
    { text: "Lebih singkat & kuat", prompt: "Pangkas jadi lebih singkat, padat, dan punchy tanpa kehilangan makna." },
    { text: "Lebih formal", prompt: "Gunakan bahasa Indonesia baku yang lebih formal dan resmi." },
  ],
};

const STRUCT_PRESETS: PresetGroup = {
  label: "Struktur",
  items: [
    { text: "Tambah angka/data", prompt: "Sisipkan angka konkret (harga, durasi, jumlah seat) jika tersedia di bahan referensi." },
    { text: "Tambah urgensi (limited seat)", prompt: "Tambahkan unsur urgensi seperti 'seat terbatas' atau 'pendaftaran segera ditutup' tanpa terkesan agresif." },
    { text: "Tambah social proof", prompt: "Tambahkan unsur kepercayaan seperti 'sudah dipercaya ribuan jamaah' atau 'berpengalaman sejak ...'." },
    { text: "Format jadi list / poin", prompt: "Susun jadi poin-poin singkat dipisah baris baru, mudah discan." },
  ],
};

// Per-layer presets
const HEADLINE_PRESETS: PresetGroup = {
  label: "Konten Headline KHT",
  items: [
    { text: "Headline Umrah Reguler", prompt: "Buat headline kuat untuk paket Umrah Reguler PT Karin Hidayah Tour." },
    { text: "Headline Umrah Plus Turki", prompt: "Buat headline untuk paket Umrah Plus Turki, highlight kemewahan & pengalaman." },
    { text: "Headline Umrah Ramadhan", prompt: "Buat headline khusus paket Umrah Ramadhan, fokus keberkahan bulan suci." },
    { text: "Headline Haji Plus", prompt: "Buat headline untuk paket Haji Plus, fokus kepastian & pelayanan VIP." },
    { text: "Headline Promo / Early Bird", prompt: "Buat headline promo Early Bird dengan benefit harga spesial." },
  ],
};

const SUB_PRESETS: PresetGroup = {
  label: "Konten Sub-headline",
  items: [
    { text: "Tekankan fasilitas hotel", prompt: "Tekankan fasilitas hotel bintang 5 dekat Masjidil Haram / Nabawi." },
    { text: "Tekankan pembimbing", prompt: "Tekankan keberadaan pembimbing ustadz berpengalaman selama perjalanan." },
    { text: "Tekankan harga & cicilan", prompt: "Sebutkan harga mulai dari ... dan opsi cicilan ringan." },
    { text: "Tekankan tanggal keberangkatan", prompt: "Sebutkan tanggal keberangkatan dan tanggal terakhir pendaftaran." },
  ],
};

const BODY_PRESETS: PresetGroup = {
  label: "Konten Body",
  items: [
    { text: "Tambah USP Umrah KHT", prompt: "Tambahkan USP PT Karin Hidayah Tour: pembimbing ustadz, hotel dekat Haram, manasik gratis, dokumen full handle." },
    { text: "Jelaskan paket termasuk apa", prompt: "Jelaskan secara ringkas apa saja yang termasuk dalam paket: tiket, hotel, visa, makan, ziarah." },
    { text: "Jelaskan keberangkatan", prompt: "Jelaskan jadwal keberangkatan, kota asal, dan maskapai yang digunakan jika ada di bahan." },
    { text: "Buat jadi storytelling singkat", prompt: "Tulis ulang sebagai storytelling singkat 2-3 kalimat yang menyentuh emosi calon jamaah." },
  ],
};

const CTA_PRESETS: PresetGroup = {
  label: "Konten CTA",
  items: [
    { text: "CTA WhatsApp", prompt: "Buat CTA singkat untuk chat WhatsApp, contoh: 'Chat Admin Sekarang'." },
    { text: "CTA Daftar", prompt: "Buat CTA pendaftaran, contoh: 'Daftar Sekarang' atau 'Amankan Seat Anda'." },
    { text: "CTA Konsultasi gratis", prompt: "Buat CTA konsultasi gratis, contoh: 'Konsultasi Gratis'." },
    { text: "CTA Lihat brosur", prompt: "Buat CTA untuk minta brosur, contoh: 'Minta Brosur Lengkap'." },
  ],
};

export default function AIRewriteDialog({ open, onOpenChange, currentText, layerKind, onApply }: Props) {
  const [instruction, setInstruction] = useState("");
  const [mediaIds, setMediaIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>("");

  const layerLabel = layerKind === "headline" ? "Headline"
    : layerKind === "subheadline" ? "Sub-headline"
    : layerKind === "cta" ? "CTA / Tombol"
    : layerKind === "body" ? "Body Text" : "Text";

  const presetGroups = useMemo<PresetGroup[]>(() => {
    const layerSpecific =
      layerKind === "headline" ? HEADLINE_PRESETS
      : layerKind === "subheadline" ? SUB_PRESETS
      : layerKind === "cta" ? CTA_PRESETS
      : BODY_PRESETS;
    return [TONE_PRESETS, STRUCT_PRESETS, layerSpecific];
  }, [layerKind]);

  const applyPreset = (promptText: string) => {
    setInstruction((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return promptText;
      // Append jika sudah ada instruksi → bisa kombinasikan beberapa preset
      return `${trimmed}\n+ ${promptText}`;
    });
  };

  const run = async () => {
    if (!instruction.trim()) {
      toast.error("Tulis atau pilih instruksi dulu");
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
              placeholder="Klik preset di bawah, atau tulis instruksi sendiri. Mis: Ganti dengan headline untuk paket Umrah Plus Turki, fokus pada kemewahan."
              className="mt-1"
              rows={3}
            />
            {instruction && (
              <button
                type="button"
                onClick={() => setInstruction("")}
                className="text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                Bersihkan instruksi
              </button>
            )}

            <div className="mt-3 space-y-2">
              {presetGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{group.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.items.map((p) => (
                      <Button
                        key={p.text}
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs"
                        onClick={() => applyPreset(p.prompt)}
                        title={p.prompt}
                      >
                        {p.text}
                      </Button>
                    ))}
                  </div>
                </div>
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
