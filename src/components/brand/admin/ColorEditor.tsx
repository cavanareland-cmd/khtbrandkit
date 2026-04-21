import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useBrandKit, type BrandKitEntry } from "@/hooks/useBrandKit";
import { toast } from "sonner";

type ColorData = {
  name: string;
  role: string;
  hex: string;
  rgb: string;
  hsl: string;
  textOn: "light" | "dark";
  category: "primary" | "secondary" | "accent" | "neutral";
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function hexToRgb(hex: string): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return "0, 0, 0";
  return m.slice(0, 3).map((h) => parseInt(h, 16)).join(", ");
}
function hexToHsl(hex: string): string {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return "0 0% 0%";
  let [r, g, b] = m.slice(0, 3).map((h) => parseInt(h, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function ColorEditor({ open, onOpenChange }: Props) {
  const { entries, upsertEntry, deleteEntry } = useBrandKit("color");
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(entries);
  }, [open, entries]);

  const update = (id: string, patch: Partial<ColorData>) => {
    setDraft((d) =>
      d.map((e) => {
        if (e.id !== id) return e;
        const next = { ...(e.data as ColorData), ...patch };
        if (patch.hex) {
          next.rgb = hexToRgb(patch.hex);
          next.hsl = hexToHsl(patch.hex);
        }
        return { ...e, data: next as unknown as Record<string, unknown> };
      }),
    );
  };

  const addColor = () => {
    const newEntry: BrandKitEntry = {
      id: `tmp-${Date.now()}`,
      section: "color",
      key: null,
      data: {
        name: "Warna Baru",
        role: "Custom",
        hex: "#888888",
        rgb: "136, 136, 136",
        hsl: "0 0% 53%",
        textOn: "light",
        category: "neutral",
      },
      sort_order: (draft[draft.length - 1]?.sort_order ?? 0) + 1,
      created_at: "",
      updated_at: "",
    };
    setDraft([...draft, newEntry]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const entry of draft) {
        const original = entries.find((e) => e.id === entry.id);
        if (entry.id.startsWith("tmp-")) {
          await upsertEntry(null, { data: entry.data, sort_order: entry.sort_order });
        } else if (original && JSON.stringify(original.data) !== JSON.stringify(entry.data)) {
          await upsertEntry(entry.id, { data: entry.data });
        }
      }
      for (const e of entries) {
        if (!draft.find((d) => d.id === e.id)) await deleteEntry(e.id);
      }
      toast.success("Palet warna tersimpan");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Edit Palet Warna</SheetTitle>
          <SheetDescription>Tambah, edit, atau hapus warna brand. RGB & HSL otomatis dihitung dari HEX.</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 py-6">
          {draft.map((entry) => {
            const c = entry.data as ColorData;
            return (
              <div key={entry.id} className="rounded-xl border border-border p-3 bg-card grid grid-cols-[auto_1fr] gap-3">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => update(entry.id, { hex: e.target.value })}
                  className="h-full w-16 rounded-md border border-input cursor-pointer"
                />
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nama</Label>
                      <Input value={c.name} onChange={(e) => update(entry.id, { name: e.target.value })} className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Role</Label>
                      <Input value={c.role} onChange={(e) => update(entry.id, { role: e.target.value })} className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">HEX</Label>
                      <Input value={c.hex} onChange={(e) => update(entry.id, { hex: e.target.value })} className="h-8 text-sm font-mono" />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Kategori</Label>
                      <Select value={c.category} onValueChange={(v: ColorData["category"]) => update(entry.id, { category: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="accent">Accent</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Text On</Label>
                      <Select value={c.textOn} onValueChange={(v: ColorData["textOn"]) => update(entry.id, { textOn: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button size="sm" variant="ghost" className="h-7 text-destructive text-xs gap-1"
                    onClick={() => setDraft((d) => d.filter((x) => x.id !== entry.id))}>
                    <Trash2 className="h-3 w-3" /> Hapus
                  </Button>
                </div>
              </div>
            );
          })}

          <Button variant="outline" onClick={addColor} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Tambah Warna
          </Button>
        </div>

        <div className="flex gap-2 sticky bottom-0 bg-background py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
