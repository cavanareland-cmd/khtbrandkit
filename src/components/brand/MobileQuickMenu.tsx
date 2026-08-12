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

    </section>
  );
};

export default MobileQuickMenu;
