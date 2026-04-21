import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrandKit, type BrandKitEntry } from "@/hooks/useBrandKit";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "sonner";

const ICON_OPTIONS = ["Plane", "Building2", "Bus", "Compass", "BookOpen", "MapPin", "Star", "Camera", "Globe", "Hotel", "Shield"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssetEditor({ open, onOpenChange }: Props) {
  const logos = useBrandKit("asset_logo");
  const icons = useBrandKit("asset_icon");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Edit Aset Visual</SheetTitle>
          <SheetDescription>Upload variasi logo dan kelola pustaka ikon.</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="logos" className="py-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="logos">Logo</TabsTrigger>
            <TabsTrigger value="icons">Ikon</TabsTrigger>
          </TabsList>
          <TabsContent value="logos" className="mt-4">
            <LogoList hook={logos} onClose={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="icons" className="mt-4">
            <IconList hook={icons} onClose={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function LogoList({ hook, onClose }: { hook: ReturnType<typeof useBrandKit>; onClose: () => void }) {
  const { entries, upsertEntry, deleteEntry } = hook;
  const { user } = useAuthSession();
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(entries); }, [entries]);

  type L = { title: string; subtitle: string; bg: string; border: string; inverse: boolean; image_url: string | null };

  const update = (id: string, patch: Partial<L>) =>
    setDraft((d) => d.map((e) => e.id === id ? { ...e, data: { ...(e.data as L), ...patch } as Record<string, unknown> } : e));

  const handleUpload = async (id: string, file: File) => {
    if (!user) return;
    setUploading(id);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/logo-${id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("brand-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("brand-assets").getPublicUrl(path);
      update(id, { image_url: publicUrl });
      toast.success("Gambar diupload");
    } catch (e) {
      toast.error("Upload gagal: " + (e instanceof Error ? e.message : "error"));
    } finally {
      setUploading(null);
    }
  };

  const add = () => setDraft([...draft, {
    id: `tmp-${Date.now()}`, section: "asset_logo", key: null,
    data: { title: "Variasi Baru", subtitle: "Custom", bg: "bg-card", border: "border-border", inverse: false, image_url: null },
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
    toast.success("Logo tersimpan");
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-3">
      {draft.map((entry) => {
        const l = entry.data as L;
        return (
          <div key={entry.id} className="rounded-xl border border-border p-3 bg-card space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Judul</Label>
                <Input value={l.title} onChange={(e) => update(entry.id, { title: e.target.value })} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Subtitle</Label>
                <Input value={l.subtitle} onChange={(e) => update(entry.id, { subtitle: e.target.value })} className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-3 items-start">
              <div className="aspect-square rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden">
                {l.image_url ? (
                  <img src={l.image_url} alt={l.title} className="w-full h-full object-contain p-2" />
                ) : (
                  <span className="text-[9px] text-muted-foreground text-center px-1">Default Logo</span>
                )}
              </div>
              <div className="space-y-2">
                <FileUploadButton
                  uploading={uploading === entry.id}
                  onFile={(f) => handleUpload(entry.id, f)}
                  hasImage={!!l.image_url}
                />
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={l.inverse} onChange={(e) => update(entry.id, { inverse: e.target.checked })} className="h-3.5 w-3.5 accent-primary" />
                  Inverse (untuk background gelap)
                </label>
              </div>
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
      <Button variant="outline" onClick={add} className="w-full gap-2"><Plus className="h-4 w-4" /> Tambah Variasi Logo</Button>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
        <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </div>
  );
}

function IconList({ hook, onClose }: { hook: ReturnType<typeof useBrandKit>; onClose: () => void }) {
  const { entries, upsertEntry, deleteEntry } = hook;
  const [draft, setDraft] = useState<BrandKitEntry[]>([]);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(entries); }, [entries]);

  type I = { icon: string; name: string; desc: string };
  const update = (id: string, patch: Partial<I>) =>
    setDraft((d) => d.map((e) => e.id === id ? { ...e, data: { ...(e.data as I), ...patch } as Record<string, unknown> } : e));

  const add = () => setDraft([...draft, {
    id: `tmp-${Date.now()}`, section: "asset_icon", key: null,
    data: { icon: "Star", name: "Ikon Baru", desc: "Description" },
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
    toast.success("Ikon tersimpan");
    setSaving(false);
    onClose();
  };

  return (
    <div className="space-y-2">
      {draft.map((entry) => {
        const i = entry.data as I;
        return (
          <div key={entry.id} className="rounded-xl border border-border p-2 bg-card grid grid-cols-[120px_1fr_1fr_auto] gap-2 items-end">
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Ikon</Label>
              <Select value={i.icon} onValueChange={(v) => update(entry.id, { icon: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kaaba">Kaaba (custom)</SelectItem>
                  {ICON_OPTIONS.map((ic) => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Nama</Label>
              <Input value={i.name} onChange={(e) => update(entry.id, { name: e.target.value })} className="h-8 text-sm" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Deskripsi</Label>
              <Input value={i.desc} onChange={(e) => update(entry.id, { desc: e.target.value })} className="h-8 text-sm" />
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
              onClick={() => setDraft((d) => d.filter((x) => x.id !== entry.id))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
      <Button variant="outline" onClick={add} className="w-full gap-2"><Plus className="h-4 w-4" /> Tambah Ikon</Button>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
        <Button onClick={save} disabled={saving} className="flex-1">{saving ? "Menyimpan…" : "Simpan"}</Button>
      </div>
    </div>
  );
}

function FileUploadButton({ uploading, onFile, hasImage }: { uploading: boolean; onFile: (f: File) => void; hasImage: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={uploading} className="w-full gap-2 text-xs">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {hasImage ? "Ganti Gambar" : "Upload Gambar"}
      </Button>
    </>
  );
}
