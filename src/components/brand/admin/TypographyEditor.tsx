import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { useBrandKit, type BrandKitEntry } from "@/hooks/useBrandKit";
import { toast } from "sonner";

type FontData = {
  name: string;
  role: string;
  className: string;
  weight: string;
  sample: string;
  desc: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TypographyEditor({ open, onOpenChange }: Props) {
  const { entries, upsertEntry, deleteEntry } = useBrandKit("typography");
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(entries);
  }, [open, entries]);

  const update = (id: string, patch: Partial<FontData>) => {
    setDraft((d) =>
      d.map((e) => (e.id === id ? { ...e, data: { ...(e.data as FontData), ...patch } as unknown as Record<string, unknown> } : e)),
    );
  };

  const addFont = () => {
    setDraft([
      ...draft,
      {
        id: `tmp-${Date.now()}`,
        section: "typography",
        key: null,
        data: { name: "Font Baru", role: "Custom", className: "font-body", weight: "400 — 700", sample: "Aa", desc: "Deskripsi font." },
        sort_order: (draft[draft.length - 1]?.sort_order ?? 0) + 1,
        created_at: "",
        updated_at: "",
      },
    ]);
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
      toast.success("Tipografi tersimpan");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Edit Tipografi</SheetTitle>
          <SheetDescription>Atur font display, body, dan accent yang muncul di section Typography.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {draft.map((entry) => {
            const f = entry.data as FontData;
            return (
              <div key={entry.id} className="rounded-xl border border-border p-4 bg-card space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nama Font</Label>
                    <Input value={f.name} onChange={(e) => update(entry.id, { name: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Role</Label>
                    <Input value={f.role} onChange={(e) => update(entry.id, { role: e.target.value })} className="h-8 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Class</Label>
                    <Input value={f.className} onChange={(e) => update(entry.id, { className: e.target.value })} className="h-8 text-sm font-mono" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Weight</Label>
                    <Input value={f.weight} onChange={(e) => update(entry.id, { weight: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sample</Label>
                    <Input value={f.sample} onChange={(e) => update(entry.id, { sample: e.target.value })} className="h-8 text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Deskripsi</Label>
                  <Textarea value={f.desc} onChange={(e) => update(entry.id, { desc: e.target.value })} rows={2} className="text-sm" />
                </div>
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" className="h-7 text-destructive text-xs gap-1"
                    onClick={() => setDraft((d) => d.filter((x) => x.id !== entry.id))}>
                    <Trash2 className="h-3 w-3" /> Hapus
                  </Button>
                </div>
              </div>
            );
          })}

          <Button variant="outline" onClick={addFont} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Tambah Font
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
