import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useBrandKit, type BrandKitEntry } from "@/hooks/useBrandKit";
import { toast } from "sonner";

const ICON_OPTIONS = ["Shield", "Heart", "Sparkles", "Users", "Star", "Award", "BookOpen", "Compass"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VoiceEditor({ open, onOpenChange }: Props) {
  const personality = useBrandKit("voice_personality");
  const voiceDo = useBrandKit("voice_do");
  const voiceDont = useBrandKit("voice_dont");
  const usage = useBrandKit("voice_usage");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Edit Brand Voice</SheetTitle>
          <SheetDescription>Kelola kepribadian, gaya bahasa, dan dos & don'ts.</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="personality" className="py-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="personality" className="text-xs">Kepribadian</TabsTrigger>
            <TabsTrigger value="do" className="text-xs">Gaya Do</TabsTrigger>
            <TabsTrigger value="dont" className="text-xs">Gaya Don't</TabsTrigger>
            <TabsTrigger value="usage" className="text-xs">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="personality" className="mt-4">
            <PersonalityList hook={personality} onClose={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="do" className="mt-4">
            <SimpleTextList hook={voiceDo} placeholder="Mantapkan niat ibadah Anda…" onClose={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="dont" className="mt-4">
            <SimpleTextList hook={voiceDont} placeholder="Promo gila-gilaan…" onClose={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="usage" className="mt-4">
            <UsageList hook={usage} onClose={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function PersonalityList({ hook, onClose }: { hook: ReturnType<typeof useBrandKit>; onClose: () => void }) {
  const { entries, upsertEntry, deleteEntry } = hook;
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(entries); }, [entries]);

  type P = { icon: string; title: string; desc: string };
  const update = (id: string, patch: Partial<P>) =>
    setDraft((d) => d.map((e) => e.id === id ? { ...e, data: { ...(e.data as P), ...patch } as Record<string, unknown> } : e));

  const add = () => setDraft([...draft, {
    id: `tmp-${Date.now()}`, section: "voice_personality", key: null,
    data: { icon: "Sparkles", title: "Sifat Baru", desc: "Deskripsi singkat." },
    sort_order: (draft[draft.length - 1]?.sort_order ?? 0) + 1,
    created_at: "", updated_at: "",
  }]);

  const save = async () => {
    setSaving(true);
    for (const e of draft) {
      const orig = entries.find((x) => x.id === e.id);
      if (e.id.startsWith("tmp-")) await upsertEntry(null, { data: e.data, sort_order: e.sort_order });
      else if (orig && JSON.stringify(orig.data) !== JSON.stringify(e.data)) await upsertEntry(e.id, { data: e.data });
    }
    for (const e of entries) if (!draft.find((d) => d.id === e.id)) await deleteEntry(e.id);
    toast.success("Tersimpan");
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-3">
      {draft.map((entry) => {
        const p = entry.data as P;
        return (
          <div key={entry.id} className="rounded-xl border border-border p-3 bg-card space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ikon</Label>
                <Select value={p.icon} onValueChange={(v) => update(entry.id, { icon: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{ICON_OPTIONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Judul</Label>
                <Input value={p.title} onChange={(e) => update(entry.id, { title: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Deskripsi</Label>
              <Textarea value={p.desc} onChange={(e) => update(entry.id, { desc: e.target.value })} rows={2} className="text-sm" />
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
      <Button variant="outline" onClick={add} className="w-full gap-2"><Plus className="h-4 w-4" /> Tambah</Button>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
        <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </div>
  );
}

function SimpleTextList({ hook, placeholder, onClose }: { hook: ReturnType<typeof useBrandKit>; placeholder: string; onClose: () => void }) {
  const { entries, upsertEntry, deleteEntry } = hook;
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(entries); }, [entries]);

  const update = (id: string, text: string) =>
    setDraft((d) => d.map((e) => e.id === id ? { ...e, data: { text } } : e));

  const add = () => setDraft([...draft, {
    id: `tmp-${Date.now()}`, section: hook.entries[0]?.section ?? "voice_do", key: null,
    data: { text: "" }, sort_order: (draft[draft.length - 1]?.sort_order ?? 0) + 1,
    created_at: "", updated_at: "",
  }]);

  const save = async () => {
    setSaving(true);
    for (const e of draft) {
      const orig = entries.find((x) => x.id === e.id);
      if (e.id.startsWith("tmp-")) await upsertEntry(null, { data: e.data, sort_order: e.sort_order });
      else if (orig && JSON.stringify(orig.data) !== JSON.stringify(e.data)) await upsertEntry(e.id, { data: e.data });
    }
    for (const e of entries) if (!draft.find((d) => d.id === e.id)) await deleteEntry(e.id);
    toast.success("Tersimpan");
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-2">
      {draft.map((entry) => (
        <div key={entry.id} className="flex gap-2">
          <Textarea
            value={(entry.data as { text: string }).text}
            onChange={(e) => update(entry.id, e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1 text-sm"
          />
          <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive shrink-0"
            onClick={() => setDraft((d) => d.filter((x) => x.id !== entry.id))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full gap-2"><Plus className="h-4 w-4" /> Tambah</Button>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
        <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </div>
  );
}

function UsageList({ hook, onClose }: { hook: ReturnType<typeof useBrandKit>; onClose: () => void }) {
  const { entries, upsertEntry, deleteEntry } = hook;
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(entries); }, [entries]);

  type U = { q: string; do: string[]; dont: string[] };

  const updateQ = (id: string, q: string) =>
    setDraft((d) => d.map((e) => e.id === id ? { ...e, data: { ...(e.data as U), q } } : e));
  const updateList = (id: string, key: "do" | "dont", text: string) =>
    setDraft((d) => d.map((e) => e.id === id ? { ...e, data: { ...(e.data as U), [key]: text.split("\n").filter(Boolean) } } : e));

  const add = () => setDraft([...draft, {
    id: `tmp-${Date.now()}`, section: "voice_usage", key: null,
    data: { q: "Topik Baru", do: [""], dont: [""] },
    sort_order: (draft[draft.length - 1]?.sort_order ?? 0) + 1,
    created_at: "", updated_at: "",
  }]);

  const save = async () => {
    setSaving(true);
    for (const e of draft) {
      const orig = entries.find((x) => x.id === e.id);
      if (e.id.startsWith("tmp-")) await upsertEntry(null, { data: e.data, sort_order: e.sort_order });
      else if (orig && JSON.stringify(orig.data) !== JSON.stringify(e.data)) await upsertEntry(e.id, { data: e.data });
    }
    for (const e of entries) if (!draft.find((d) => d.id === e.id)) await deleteEntry(e.id);
    toast.success("Tersimpan");
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-3">
      {draft.map((entry) => {
        const u = entry.data as U;
        return (
          <div key={entry.id} className="rounded-xl border border-border p-3 bg-card space-y-2">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Judul Topik</Label>
              <Input value={u.q} onChange={(e) => updateQ(entry.id, e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-primary">✓ Boleh (1 per baris)</Label>
                <Textarea value={(u.do ?? []).join("\n")} onChange={(e) => updateList(entry.id, "do", e.target.value)} rows={4} className="text-xs" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-destructive">✗ Tidak (1 per baris)</Label>
                <Textarea value={(u.dont ?? []).join("\n")} onChange={(e) => updateList(entry.id, "dont", e.target.value)} rows={4} className="text-xs" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="ghost" className="h-7 text-destructive text-xs gap-1"
                onClick={() => setDraft((d) => d.filter((x) => x.id !== entry.id))}>
                <Trash2 className="h-3 w-3" /> Hapus topik
              </Button>
            </div>
          </div>
        );
      })}
      <Button variant="outline" onClick={add} className="w-full gap-2"><Plus className="h-4 w-4" /> Tambah Topik</Button>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
        <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </div>
  );
}
