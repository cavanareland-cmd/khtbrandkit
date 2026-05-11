import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type GeneratedIcon = { name: string; description: string; image_url: string };

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function IconCreatorDialog({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [style, setStyle] = useState<"line" | "filled" | "duotone">("line");
  const [count, setCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedIcon[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIdx, setSavedIdx] = useState<Set<number>>(new Set());

  const generate = async () => {
    if (!name.trim()) {
      toast.error("Nama ikon wajib diisi");
      return;
    }
    setLoading(true);
    setResults([]);
    setSavedIdx(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("generate-brand-icon", {
        body: { name: name.trim(), description: description.trim(), style, count },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Gagal generate ikon");
      setResults(data.icons as GeneratedIcon[]);
      toast.success(`${data.icons.length} ikon dibuat sesuai brand kit ✨`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generate gagal");
    } finally {
      setLoading(false);
    }
  };

  const saveToBrandKit = async (idx: number) => {
    const icon = results[idx];
    setSavingIdx(idx);
    try {
      const { data: existing } = await supabase
        .from("brand_kit")
        .select("sort_order")
        .eq("section", "asset_icon")
        .order("sort_order", { ascending: false })
        .limit(1);
      const nextOrder = ((existing?.[0]?.sort_order as number | undefined) ?? 0) + 1;
      const { error } = await supabase.from("brand_kit").insert({
        section: "asset_icon",
        data: {
          icon: "Star",
          name: icon.name,
          desc: icon.description || "AI Generated",
          image_url: icon.image_url,
        } as never,
        sort_order: nextOrder,
      });
      if (error) throw error;
      setSavedIdx((s) => new Set(s).add(idx));
      toast.success("Ikon disimpan ke Brand Kit");
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
            <Sparkles className="h-5 w-5 text-primary" /> Icon Creator Otomatis
          </DialogTitle>
          <DialogDescription>
            AI akan membuat ikon sesuai palet & identitas Brand Kit Anda.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Nama Ikon</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="cth: Mosque, Prayer, Visa" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Deskripsi (opsional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="cth: simbol masjid dengan kubah" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Gaya</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as typeof style)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Art (2px stroke)</SelectItem>
                <SelectItem value="filled">Filled / Solid</SelectItem>
                <SelectItem value="duotone">Duotone</SelectItem>
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
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">Palet & identitas brand otomatis di-inject ke prompt.</p>
        </div>

        <Button onClick={generate} disabled={loading} className="gap-2 w-full mt-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Membuat ikon…" : "Generate Ikon"}
        </Button>

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            {results.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
                <div className="aspect-square bg-muted/40 flex items-center justify-center p-3">
                  <img src={r.image_url} alt={r.name} className="w-full h-full object-contain" />
                </div>
                <div className="p-2 border-t border-border">
                  <p className="text-xs font-medium truncate">{r.name}</p>
                  <Button
                    size="sm"
                    variant={savedIdx.has(i) ? "secondary" : "default"}
                    disabled={savingIdx === i || savedIdx.has(i)}
                    onClick={() => saveToBrandKit(i)}
                    className="w-full mt-2 h-7 text-[11px] gap-1"
                  >
                    {savingIdx === i ? <Loader2 className="h-3 w-3 animate-spin" /> :
                      savedIdx.has(i) ? <><Check className="h-3 w-3" /> Tersimpan</> : "Simpan ke Brand Kit"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
