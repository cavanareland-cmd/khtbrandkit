import fallbackLogo from "@/assets/karin-logo.png";
import { Link } from "react-router-dom";
import { Sparkles, LayoutDashboard, FileImage } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useBrandIdentity } from "@/hooks/useBrandIdentity";

const Header = () => {
  const { isAuthed } = useAuthSession();
  const brand = useBrandIdentity();
  const logo = brand.logoUrl || brand.lockupUrl || fallbackLogo;

  const links = [
    { label: "Identitas", href: "#hero" },
    { label: "Warna", href: "#colors" },
    { label: "Tipografi", href: "#typography" },
    { label: "Aset", href: "#assets" },
    { label: "Brand Voice", href: "#voice" },
    { label: "Company Profile", href: "/company-profile" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <a href="#hero" className="flex items-center gap-3 group">
          <div className="relative">
            <img src={logo} alt="Karin Hidayah Tour" className="h-11 w-11 transition-smooth group-hover:scale-105" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-wordmark text-base font-bold text-secondary tracking-tight">Karin Hidayah Tour</span>
            <span className="text-[10px] font-alt uppercase tracking-[0.2em] text-secondary/70">Brand Kit · v1.0</span>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-smooth rounded-md hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isAuthed && (
            <>
              <Link
                to="/assets"
                className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/40 transition-smooth"
              >
                <FileImage className="h-3.5 w-3.5" />
                Buat Aset
              </Link>
              <Link
                to="/admin"
                className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground/80 hover:text-primary hover:border-primary/40 transition-smooth"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Admin
              </Link>
            </>
          )}
          <Link
            to="/studio"
            className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-primary px-5 text-sm font-medium text-primary-foreground shadow-elegant hover:shadow-glow transition-smooth"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Studio
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
