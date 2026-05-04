import { Link } from "react-router-dom";
import {
  Sparkles,
  LayoutTemplate,
  Image as ImageIcon,
  Palette,
  Type,
  Megaphone,
  Building2,
  FolderHeart,
  Wand2,
  Plus,
  Phone,
  Shield, // Tambahan ikon untuk Admin
  type LucideIcon,
} from "lucide-react";

type Tile = {
  to: string;
  label: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "secondary";
};

const TOP: Tile[] = [
  { to: "/studio", label: "Studio", icon: Plus, tone: "primary" },
  { to: "/assets", label: "Buat Aset", icon: Wand2, tone: "accent" },
  { to: "/gallery", label: "Galeri", icon: FolderHeart, tone: "secondary" },
];

const GRID: { to: string; label: string; icon: LucideIcon; bg: string; fg: string }[] = [
  { to: "/assets", label: "Template", icon: LayoutTemplate, bg: "bg-rose-100", fg: "text-rose-600" },
  { to: "/assets", label: "Media", icon: ImageIcon, bg: "bg-amber-100", fg: "text-amber-600" },
  { to: "/", label: "Warna", icon: Palette, bg: "bg-pink-100", fg: "text-pink-600" },
  { to: "/", label: "Font", icon: Type, bg: "bg-emerald-100", fg: "text-emerald-600" },
  { to: "/studio", label: "Promo", icon: Megaphone, bg: "bg-sky-100", fg: "text-sky-600" },
  { to: "/company-profile", label: "Profil", icon: Building2, bg: "bg-violet-100", fg: "text-violet-600" },
  { to: "/admin", label: "Admin", icon: Shield, bg: "bg-orange-100", fg: "text-orange-600" },
  { to: "/company-profile#contact", label: "Kontak", icon: Phone, bg: "bg-slate-100", fg: "text-slate-600" },
];

const toneClass: Record<Tile["tone"], string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

const MobileQuickMenu = () => {
  return (
    <section className="md:hidden px-4 pt-4 pb-2">
      {/* Top highlighted card */}
      <div className="rounded-3xl bg-gradient-hero p-4 shadow-elegant relative overflow-hidden">
        <div className="absolute inset-0 arabesque-pattern opacity-20" />
        <div className="relative grid grid-cols-3 gap-3">
          {TOP.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-secondary-foreground/10 backdrop-blur-sm py-3 hover:bg-secondary-foreground/20 transition-smooth"
            >
              <span className={`h-9 w-9 rounded-full flex items-center justify-center shadow-md ${toneClass[t.tone]}`}>
                <t.icon className="h-4 w-4" />
              </span>
              <span className="text-[11px] font-medium text-secondary-foreground">{t.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* 4-col icon grid */}
      <div className="mt-4 grid grid-cols-4 gap-3">
        {GRID.map((g) => (
          <Link
            key={g.label}
            to={g.to}
            className="flex flex-col items-center gap-1.5 group"
          >
            <span
              className={`h-14 w-14 rounded-2xl ${g.bg} ${g.fg} flex items-center justify-center shadow-sm group-active:scale-95 transition-transform`}
            >
              <g.icon className="h-6 w-6" />
            </span>
            <span className="text-[10px] text-foreground/75 text-center leading-tight">{g.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default MobileQuickMenu;
