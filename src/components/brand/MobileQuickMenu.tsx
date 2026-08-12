import { Link } from "react-router-dom";
import {
  FolderHeart,
  Wand2,
  Plus,
  Sparkles,
  LayoutTemplate,
  Palette,
  Image,
  FileText,
  Type,
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

const toneClass: Record<Tile["tone"], string> = {
  primary: "bg-primary text-primary-foreground",
  accent: "bg-accent text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

type QuickItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  bg: string;
  iconColor: string;
};

const GRID: QuickItem[] = [
  { to: "/studio", label: "AI Studio", icon: Sparkles, bg: "bg-rose-100", iconColor: "text-rose-600" },
  { to: "/assets", label: "Template", icon: LayoutTemplate, bg: "bg-sky-100", iconColor: "text-sky-600" },
  { to: "/company-profile", label: "Brand Kit", icon: Palette, bg: "bg-amber-100", iconColor: "text-amber-600" },
  { to: "/gallery", label: "Media", icon: Image, bg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { to: "/assets", label: "Brief", icon: FileText, bg: "bg-violet-100", iconColor: "text-violet-600" },
  { to: "/company-profile", label: "Tipografi", icon: Type, bg: "bg-cyan-100", iconColor: "text-cyan-600" },
  { to: "/studio", label: "Poster", icon: LayoutTemplate, bg: "bg-fuchsia-100", iconColor: "text-fuchsia-600" },
  { to: "/assets", label: "Icon", icon: Sparkles, bg: "bg-lime-100", iconColor: "text-lime-600" },
];

const MobileQuickMenu = () => {
  return (
    <section className="px-4 sm:px-0 pt-4 pb-2">
      {/* Top highlighted card */}
      <div className="rounded-3xl bg-gradient-hero p-4 md:p-6 shadow-elegant relative overflow-hidden">
        <div className="absolute inset-0 arabesque-pattern opacity-20" />
        <div className="relative grid grid-cols-3 gap-3 md:gap-5">
          {TOP.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              className="flex flex-col items-center justify-center gap-1.5 md:gap-2 rounded-2xl bg-secondary-foreground/10 backdrop-blur-sm py-3 md:py-5 hover:bg-secondary-foreground/20 transition-smooth"
            >
              <span className={`h-9 w-9 md:h-12 md:w-12 rounded-full flex items-center justify-center shadow-md ${toneClass[t.tone]}`}>
                <t.icon className="h-4 w-4 md:h-5 md:w-5" />
              </span>
              <span className="text-[11px] md:text-sm font-medium text-secondary-foreground">{t.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick icon grid — satu lokasi, di bawah 3 kartu utama */}
      <div className="mt-4 md:mt-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
          {GRID.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex flex-col items-center gap-2 rounded-2xl p-3 md:p-4 bg-card shadow-sm border border-border/50 hover:shadow-md hover:scale-[1.02] transition-smooth"
            >
              <span className={`h-10 w-10 md:h-12 md:w-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                <item.icon className={`h-5 w-5 md:h-6 md:w-6 ${item.iconColor}`} />
              </span>
              <span className="text-[10px] md:text-xs font-medium text-foreground text-center leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MobileQuickMenu;
