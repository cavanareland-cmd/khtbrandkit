import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useBrandKit, type BrandKitEntry } from "@/hooks/useBrandKit";
import { toast } from "sonner";

type Identity = { value: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IdentityEditor({ open, onOpenChange }: Props) {
  const { entries, upsertEntry, deleteEntry } = useBrandKit("identity");
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(entries);
  }, [open, entries]);

  const updateField = (id: string, value: string) => {
    setDraft((d) => d.map((e) => (e.id === id ? { ...e, data: { ...e.data, value } } : e)));
  };

  const addTagPill = () => {
    const newEntry: BrandKitEntry = {
      id: `tmp-${Date.now()}`,
      section: "identity",
      key: "tag_pill",
      data: { value: "Tag Baru" },
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
        const isNew = entry.id.startsWith("tmp-");
        if (isNew) {
          await upsertEntry(null, { key: entry.key, data: entry.data, sort_order: entry.sort_order });
        } else if (
          original &&
          JSON.stringify(original.data) !== JSON.stringify(entry.data)
        ) {
          await upsertEntry(entry.id, { data: entry.data });
        }
      }
      // Deletions
      for (const e of entries) {
        if (!draft.find((d) => d.id === e.id)) await deleteEntry(e.id);
      }
      toast.success("Identitas tersimpan");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const grouped = draft.reduce<Record<string, BrandKitEntry[]>>((acc, e) => {
    const k = e.key ?? "other";
    (acc[k] ??= []).push(e);
    return acc;
  }, {});

  const renderField = (entry: BrandKitEntry, label: string, multiline = false) => (
    <div key={entry.id} className="space-y-1.5">
      <Label className="text-xs font-alt uppercase tracking-widest text-muted-foreground">{label}</Label>
      {multiline ? (
        <Textarea
          value={(entry.data as Identity).value ?? ""}
          onChange={(e) => updateField(entry.id, e.target.value)}
          rows={3}
        />
      ) : (
        <Input
          value={(entry.data as Identity).value ?? ""}
          onChange={(e) => updateField(entry.id, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Edit Identitas Brand</SheetTitle>
          <SheetDescription>
            Ubah nama, tagline, dan label hero. Perubahan langsung tersinkron ke homepage.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-6">
          {grouped.brand_name_primary?.[0] && renderField(grouped.brand_name_primary[0], "Nama Brand (baris 1)")}
          {grouped.brand_name_secondary?.[0] && renderField(grouped.brand_name_secondary[0], "Nama Brand (baris 2)")}
          {grouped.category_label?.[0] && renderField(grouped.category_label[0], "Kategori")}
          {grouped.badge_label?.[0] && renderField(grouped.badge_label[0], "Badge Label")}
          {grouped.tagline?.[0] && renderField(grouped.tagline[0], "Tagline / Slogan", true)}

          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-alt uppercase tracking-widest text-muted-foreground">Tag Pills (Hero)</Label>
              <Button size="sm" variant="outline" onClick={addTagPill} className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" /> Tambah
              </Button>
            </div>
            {grouped.tag_pill?.map((entry) => (
              <div key={entry.id} className="flex gap-2 items-center">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={(entry.data as Identity).value ?? ""}
                  onChange={(e) => updateField(entry.id, e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive"
                  onClick={() => setDraft((d) => d.filter((x) => x.id !== entry.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 sticky bottom-0 bg-background py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Batal</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
