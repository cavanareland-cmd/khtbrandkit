import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Loader2, LogOut, ImageOff } from "lucide-react";
import logo from "@/assets/karin-logo.png";

type Creation = {
  id: string;
  title: string;
  format: string;
  media_type: string;
  status: string;
  background_image_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

const FORMAT_LABELS: Record<string, string> = {
  a4_portrait: "Flyer A4",
  instagram_post: "IG Post",
  instagram_story: "Story",
  banner_landscape: "Banner",
};

const Gallery = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [items, setItems] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Galeri · Brand Kit · KHT";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth");
      else { setUser(session.user); load(); }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else { setUser(session.user); load(); }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("creations")
      .select("id, title, format, media_type, status, background_image_url, thumbnail_url, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Gagal memuat galeri");
    else setItems((data as Creation[]) || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kreasi ini?")) return;
    const { error } = await supabase.from("creations").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus");
    else { toast.success("Dihapus"); load(); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="KHT" className="h-9 w-9" />
            <div className="hidden sm:block">
              <p className="font-display font-bold text-sm leading-tight text-primary">Brand Kit Studio</p>
              <p className="text-[10px] font-alt uppercase tracking-widest text-muted-foreground">Galeri Kreasi</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/studio">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Kreasi Baru
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10">
        <div className="mb-8">
          <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-2">Galeri</p>
          <h1 className="font-display text-4xl font-bold text-secondary">Kreasi Anda</h1>
          <p className="text-muted-foreground mt-2">{items.length} kreasi tersimpan</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl bg-gradient-soft">
            <ImageOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-2xl font-semibold text-secondary mb-2">Belum ada kreasi</h3>
            <p className="text-muted-foreground mb-6">Mulai buat poster, flyer, atau konten sosmed pertama Anda.</p>
            <Link to="/studio">
              <Button className="bg-gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Buat Sekarang
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => (
              <div key={item.id} className="group rounded-2xl overflow-hidden border border-border bg-card shadow-md hover:shadow-elegant transition-smooth">
                <Link to={`/studio?id=${item.id}`} className="block aspect-square bg-muted relative overflow-hidden">
                  {item.background_image_url ? (
                    <img src={item.background_image_url} alt={item.title} className="w-full h-full object-cover transition-smooth group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-hero">
                      <ImageOff className="h-8 w-8 text-primary-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-secondary/90 text-secondary-foreground text-[10px] font-alt uppercase tracking-widest">
                    {FORMAT_LABELS[item.format] || item.format}
                  </div>
                  {item.status === "draft" && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-alt uppercase tracking-widest">
                      Draft
                    </div>
                  )}
                </Link>
                <div className="p-3">
                  <p className="font-display font-semibold text-sm truncate text-foreground">{item.title}</p>
                  <p className="text-[10px] font-alt uppercase tracking-widest text-muted-foreground mt-0.5">
                    {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <Link to={`/studio?id=${item.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs"><Edit3 className="h-3 w-3 mr-1" />Edit</Button>
                    </Link>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Gallery;
