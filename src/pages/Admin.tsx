import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, LayoutTemplate, ImageIcon, FolderHeart, LogOut, ExternalLink, Loader2, Eye, EyeOff, RefreshCw, Monitor, Tablet, Smartphone } from "lucide-react";
import logo from "@/assets/karin-logo.png";
import PageEditor from "@/components/admin/PageEditor";
import TemplatesAdmin from "@/components/admin/TemplatesAdmin";
import MediaAdmin from "@/components/admin/MediaAdmin";
import CreationsAdmin from "@/components/admin/CreationsAdmin";

type Tab = "company-profile" | "index" | "templates" | "media" | "creations";

const Admin = () => {
  const { user, loading } = useAuthSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) || "company-profile");

  useEffect(() => {
    if (!loading && !user) navigate("/auth?redirect=/admin");
  }, [loading, user, navigate]);

  useEffect(() => {
    setParams({ tab }, { replace: true });
  }, [tab, setParams]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  const navItems: { key: Tab; label: string; icon: typeof FileText; group: string }[] = [
    { key: "company-profile", label: "Company Profile", icon: FileText, group: "Pages" },
    { key: "index", label: "Landing Page", icon: FileText, group: "Pages" },
    { key: "templates", label: "Templates", icon: LayoutTemplate, group: "Library" },
    { key: "media", label: "Media Library", icon: ImageIcon, group: "Library" },
    { key: "creations", label: "Karya Studio", icon: FolderHeart, group: "Library" },
  ];

  const groups = Array.from(new Set(navItems.map((n) => n.group)));

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* SIDEBAR */}
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="KHT" className="h-10 w-10" />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-primary">KHT Admin</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">CMS Dashboard</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {groups.map((g) => (
            <div key={g}>
              <p className="px-2 mb-2 text-[10px] font-alt uppercase tracking-widest text-muted-foreground">{g}</p>
              <div className="space-y-1">
                {navItems
                  .filter((n) => n.group === g)
                  .map((item) => {
                    const active = tab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setTab(item.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground/75 hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link
            to="/studio"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-foreground/75 hover:bg-muted hover:text-foreground transition-colors"
          >
            <Sparkles className="h-4 w-4" /> AI Studio
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-foreground/75 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/85 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-secondary">
                {navItems.find((n) => n.key === tab)?.label}
              </h1>
              <p className="text-xs text-muted-foreground">Login sebagai {user.email}</p>
            </div>
            {(tab === "company-profile" || tab === "index") && (
              <Button asChild variant="outline" size="sm">
                <a
                  href={tab === "index" ? "/" : `/${tab}`}
                  target="_blank"
                  rel="noreferrer"
                  className="gap-1.5"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Buka Halaman
                </a>
              </Button>
            )}
          </div>
        </header>

        <div className="p-6">
          {tab === "company-profile" && <PageEditor pageSlug="company-profile" />}
          {tab === "index" && <PageEditor pageSlug="index" />}
          {tab === "templates" && <TemplatesAdmin />}
          {tab === "media" && <MediaAdmin />}
          {tab === "creations" && <CreationsAdmin />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
