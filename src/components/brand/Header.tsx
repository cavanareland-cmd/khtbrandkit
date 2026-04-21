import logo from "@/assets/karin-logo.png";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Header = () => {
  const links = [
    { label: "Identitas", href: "#hero" },
    { label: "Warna", href: "#colors" },
    { label: "Tipografi", href: "#typography" },
    { label: "Aset", href: "#assets" },
    { label: "Brand Voice", href: "#voice" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <a href="#hero" className="flex items-center gap-3 group">
          <div className="relative">
            <img src={logo} alt="Karin Hidayah Tour" className="h-11 w-11 transition-smooth group-hover:scale-105" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-bold text-primary tracking-tight">Karin Hidayah Tour</span>
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
        <Link
          to="/studio"
          className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-primary px-5 text-sm font-medium text-primary-foreground shadow-elegant hover:shadow-glow transition-smooth"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Studio
        </Link>
      </div>
    </header>
  );
};

export default Header;
