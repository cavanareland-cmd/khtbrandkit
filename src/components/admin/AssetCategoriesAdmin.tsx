import { useState } from "react";
import { useBrandKit, type BrandKitEntry } from "@/hooks/useBrandKit";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Save, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { useAssetCategories } from "@/hooks/useAssetCategories";

const FORMATS = ["1080x1350", "1080x1080", "1080x1920", "1200x628", "1920x1080"];
const ACCENTS = [
  "from-primary/20 to-secondary/20",
  "from-secondary/20 to-accent/20",
  "from-accent/20 to-primary/20",
  "from-primary/20 to-accent/20",
  "from-secondary/20 to-primary/20",
];

type CatData = { key: string; title: string; desc: string; icon: string; format: string; accent: string };

export default function AssetCategoriesAdmin() {
  const { entries, loading, upsertEntry, deleteEntry, refresh } = useBrandKit("asset_category");
  const { iconList } = useAssetCategories();
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateField = async (entry: BrandKitEntry, field: keyof CatData, value: string) => {
    const data = { ...(entry.data as Record<string, string>), [field]: value };
    setSavingId(entry.id);
    await upsertEntry(entry.id, { data });
    setSavingId(null);
  };

  const move = async (entry: BrandKitEntry, dir: -1 | 1) => {
    const sorted = [...entries].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((e) => e.id === entry.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await upsertEntry(entry.id, { sort_order: swap.sort_order });
    await upsertEntry(swap.id, { sort_order: entry.sort_order });
  };

  const addNew = async () => {
    const key = `category_${Date.now()}`;
    const ok = await upsertEntry(null, {
      key,
      data: { key, title: "Kategori Baru", desc: "Deskripsi singkat", icon: "ImageIcon", format: "1080x1350", accent: ACCENTS[0] },
      sort_order: entries.length + 1,
    });
    if (ok) toast.success("Kategori baru ditambahkan");
  };

  const remove = async (entry: BrandKitEntry) => {
    if (!confirm(`Hapus kategori "${(entry.data as Record<string, string>).title}"?`)) return;
    const ok = await deleteEntry(entry.id);
    if (ok) {
      toast.success("Dihapus");
      refresh();
    }
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Kategori Aset (/assets)</h2>
          <p className="text-xs text-muted-foreground">Kelola kartu kategori yang muncul di halaman Buat Aset. Perubahan langsung sync ke frontend.</p>
        </div>
        <Button onClick={addNew} size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Tambah Kategori</Button>
      </div>

      <div className="grid gap-4">
        {entries.sort((a, b) => a.sort_order - b.sort_order).map((entry, i) => {
          const d = (entry.data as Record<string, string>) || {};
          return (
            <Card key={entry.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-muted rounded">#{entry.sort_order}</span>
                  <code className="text-[11px] text-muted-foreground">{d.key}</code>
                  {savingId === entry.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(entry, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === entries.length - 1} onClick={() => move(entry, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(entry)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Judul</Label>
                  <Input value={d.title || ""} onChange={(e) => updateField(entry, "title", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Key (slug)</Label>
                  <Input value={d.key || ""} onChange={(e) => updateField(entry, "key", e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Deskripsi</Label>
                  <Input value={d.desc || ""} onChange={(e) => updateField(entry, "desc", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Format</Label>
                  <Select value={d.format || "1080x1350"} onValueChange={(v) => updateField(entry, "format", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Icon</Label>
                  <Select value={d.icon || "ImageIcon"} onValueChange={(v) => updateField(entry, "icon", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {iconList.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs">Accent gradient</Label>
                  <Select value={d.accent || ACCENTS[0]} onValueChange={(v) => updateField(entry, "accent", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCENTS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          );
        })}
        {entries.length === 0 && (
          <Card className="p-8 text-center text-sm text-muted-foreground">Belum ada kategori. Klik <Save className="inline h-3 w-3" /> Tambah Kategori untuk memulai.</Card>
        )}
      </div>
    </div>
  );
}
