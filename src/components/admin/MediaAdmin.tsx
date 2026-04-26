import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MediaRow = {
  id: string;
  name: string;
  file_url: string;
  preview_url: string | null;
  file_type: string;
  status: string;
  created_at: string;
  tags: string[] | null;
};

const MediaAdmin = () => {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media_library")
      .select("id,name,file_url,preview_url,file_type,status,created_at,tags")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as MediaRow[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Hapus media ini?")) return;
    const { error } = await supabase.from("media_library").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Media dihapus");
    refresh();
  };

  const filtered = items.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="max-w-6xl">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <Input placeholder="Cari media..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <span className="text-sm text-muted-foreground">{filtered.length} media</span>
      </div>
      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Preview</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                    {m.preview_url || m.file_url ? (
                      <img src={m.preview_url || m.file_url} alt={m.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-xs uppercase">{m.file_type}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{m.status}</span></TableCell>
                <TableCell className="text-right">
                  <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                    <a href={m.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(m.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Belum ada media</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};

export default MediaAdmin;
