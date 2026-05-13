import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Check, Palette, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Generated = { name: string; description: string; image_url: string; kind: string; style: string };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const KINDS = [
  { v: "accent", label: "Aksen / Flourish" },
  { v: "shape", label: "Bentuk Dekoratif" },
  { v: "pattern", label: "Pattern / Pola" },
  { v: "divider", label: "Divider / Pemisah" },
  { v: "badge", label: "Badge / Stempel" },
  { v: "frame", label: "Frame / Border" },
  { v: "illustration", label: "Spot Illustration" },
];

const STYLES = [
  { v: "flat", label: "Flat Vector" },
  { v: "line", label: "Line Art" },
  { v: "duotone", label: "Duotone" },
  { v: "gradient", label: "Gradient Premium" },
  { v: "textured", label: "Textured" },
];

export default function GraphicCreatorDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("accent");
  const [style, setStyle] = useState("flat");
  const [transparent, setTransparent] = useState(true);
  const [count, setCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Generated[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());

  const generate = async () => {
    if (!name.trim()) { toast.error("Nama elemen wajib diisi"); return; }
    setLoading(true);
    setResults([]);
    setSavedIdx(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("generate-brand-graphic", {
        body: { name: name.trim(), description: description.trim(), kind, style, transparent, count },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Gagal generate");
      setResults(data.graphics as Generated[]);
      toast.success(`${data.graphics.length} elemen visual dibuat ✨`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generate gagal");
    } finally {
      setLoading(false);
    }
  };

  const saveToBrandKit = async (idx: number) => {
    const g = results[idx];
    setSavingIdx(idx);
    try {
      const { data: existing } = await supabase
        .from("brand_kit")
        .select("sort_order")
        .eq("section", "asset_graphic")
        .order("sort_order", { ascending: false })
        .limit(1);
      const nextOrder = ((existing?.[0]?.sort_order as number | undefined) ?? 0) + 1;
      const { error } = await supabase.from("brand_kit").insert({
        section: "asset_graphic",
        data: {
          name: g.name,
          desc: g.description || `${g.kind} · ${g.style}`,
          kind: g.kind,
          style: g.style,
          image_url: g.image_url,
        } as never,
        sort_order: nextOrder,
      });
      if (error) throw error;
      setSavedIdx((s) => new Set(s).add(idx));
      toast.success("Tersimpan ke Brand Kit");
    } catch (e) {
      toast.error("Simpan gagal: " + (e instanceof Error ? e.message : "error"));
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles className="h-5 w-5 text-primary" /> Graphic / Vector Accent Creator
          </DialogTitle>
          <DialogDescription>
            AI bikin grafis dekoratif & aksen vector sesuai palet & identitas Brand Kit Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nama Elemen</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Sparkle Crescent, Arabesque Swirl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Deskripsi (opsional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="cth: ornamen bulan sabit + percikan" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Jenis</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => <SelectItem key={k.v} value={k.v}>{k.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Gaya</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Jumlah Variasi</Label>
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="h-4 w-4 accent-primary" />
              Background transparan (PNG)
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">Palet & identitas brand otomatis di-inject ke prompt AI.</p>
        </div>

        <Button onClick={generate} disabled={loading} className="gap-2 w-full mt-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Membuat elemen visual…" : "Generate Elemen Visual"}
        </Button>

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {results.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                <div
                  className="aspect-square flex items-center justify-center p-3"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                  }}
                >
                  <img src={r.image_url} alt={r.name} className="w-full h-full object-contain" />
                </div>
                <div className="p-2 border-t border-border space-y-1">
                  <p className="text-xs font-medium truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.kind} · {r.style}</p>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={savedIdx.has(i) ? "secondary" : "default"}
                      disabled={savingIdx === i || savedIdx.has(i)}
                      onClick={() => saveToBrandKit(i)}
                      className="flex-1 h-7 text-[11px] gap-1"
                    >
                      {savingIdx === i ? <Loader2 className="h-3 w-3 animate-spin" /> :
                        savedIdx.has(i) ? <><Check className="h-3 w-3" /> Saved</> : "Simpan"}
                    </Button>
                    <Button asChild size="sm" variant="outline" className="h-7 px-2">
                      <a href={r.image_url} download target="_blank" rel="noreferrer"><Download className="h-3 w-3" /></a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
