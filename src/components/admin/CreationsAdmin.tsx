import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CreationRow = {
  id: string;
  title: string;
  format: string;
  media_type: string;
  status: string;
  thumbnail_url: string | null;
  background_image_url: string | null;
  created_at: string;
};

const CreationsAdmin = () => {
  const [items, setItems] = useState<CreationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("creations")
      .select("id,title,format,media_type,status,thumbnail_url,background_image_url,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as CreationRow[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Hapus karya ini?")) return;
    const { error } = await supabase.from("creations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Karya dihapus");
    refresh();
  };

  const filtered = items.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="max-w-6xl">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <Input placeholder="Cari karya..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <span className="text-sm text-muted-foreground">{filtered.length} karya</span>
      </div>
      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Preview</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const img = c.thumbnail_url || c.background_image_url;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                      {img ? <img src={img} alt={c.title} className="h-full w-full object-cover" /> : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell className="text-xs">{c.format} · {c.media_type}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{c.status}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">
                    {img && (
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                        <a href={img} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)} className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">Belum ada karya</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};

export default CreationsAdmin;
