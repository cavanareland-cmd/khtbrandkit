import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TemplateRow = {
  id: string;
  name: string;
  file_url: string;
  preview_url: string | null;
  status: string;
  created_at: string;
  user_id: string;
};

const TemplatesAdmin = () => {
  const [items, setItems] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("templates")
      .select("id,name,file_url,preview_url,status,created_at,user_id")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as TemplateRow[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Hapus template ini?")) return;
    const { error } = await supabase.from("templates").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Template dihapus");
    refresh();
  };

  const filtered = items.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="max-w-6xl">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <Input
          placeholder="Cari template..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <span className="text-sm text-muted-foreground">{filtered.length} template</span>
      </div>
      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Preview</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="h-12 w-12 rounded bg-muted overflow-hidden">
                    {t.preview_url || t.file_url ? (
                      <img src={t.preview_url || t.file_url} alt={t.name} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{t.status}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                    <a href={t.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Belum ada template</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
};

export default TemplatesAdmin;
