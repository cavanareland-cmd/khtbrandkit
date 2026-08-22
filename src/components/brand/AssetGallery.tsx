import { useRef, useState } from "react";
import defaultLogo from "@/assets/karin-logo.png";
import { Download, Plane, Building2, Bus, Compass, BookOpen, MapPin, Star, Camera, Globe, Hotel, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useBrandKit } from "@/hooks/useBrandKit";
import EditButton from "./admin/EditButton";
import AssetEditor from "./admin/AssetEditor";
import {
  assetFilename,
  downloadFromUrl,
  downloadRasterAsSvg,
  downloadSvgElement,
} from "@/lib/downloadAsset";


const KaabaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="14" y="20" width="36" height="34" rx="1" />
    <path d="M14 28h36" />
    <path d="M14 20l18-10 18 10" />
    <path d="M28 36h8v18h-8z" />
    <path d="M14 24h36" strokeDasharray="2 2" />
  </svg>
);

const ICON_MAP: Record<string, LucideIcon> = {
  Plane, Building2, Bus, Compass, BookOpen, MapPin, Star, Camera, Globe, Hotel, Shield,
};

type LogoVariant = { title: string; subtitle: string; bg: string; border: string; inverse: boolean; image_url: string | null };
type IconItem = { icon: string; name: string; desc: string; image_url?: string };
type GraphicItem = { name: string; desc: string; kind: string; style: string; image_url: string };

const AssetGallery = () => {
  const logos = useBrandKit("asset_logo");
  const icons = useBrandKit("asset_icon");
  const graphics = useBrandKit("asset_graphic");
  const [editorOpen, setEditorOpen] = useState(false);

  const logoVariants: LogoVariant[] = logos.entries.map((e) => e.data as unknown as LogoVariant);
  const iconList: IconItem[] = icons.entries.map((e) => e.data as unknown as IconItem);
  const graphicList: GraphicItem[] = graphics.entries.map((e) => e.data as unknown as GraphicItem);

  return (
    <section id="assets" className="py-12 md:py-24 bg-background relative">
      <div className="container px-4 mx-auto">
        {/* Header Section - Fix untuk image_5774df.png */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-4">04 — Visual Assets</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-secondary mb-4">Galeri Aset</h2>
            <p className="text-base md:text-lg text-muted-foreground">
              Variasi logo dan ikonografi yang konsisten — siap digunakan di semua media komunikasi brand **Karin Hidayah Tour**.
            </p>
          </div>
          <div className="shrink-0">
            <EditButton onClick={() => setEditorOpen(true)} label="Edit Aset" />
          </div>
        </div>

        {/* Logo Variants */}
        <h3 className="font-display text-2xl font-semibold text-foreground mb-6 mt-8">Variasi Logo</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-20">
          {logoVariants.map((v) => (
            <div key={v.title} className={`group rounded-2xl ${v.bg} ${v.border} border overflow-hidden shadow-md hover:shadow-elegant transition-smooth`}>
              <div className="aspect-square flex items-center justify-center p-8 md:p-12 relative">
                <img
                  src={v.image_url || defaultLogo}
                  alt={v.title}
                  className={`w-full h-full object-contain transition-smooth group-hover:scale-105 ${v.inverse && !v.image_url ? "brightness-0 invert" : ""}`}
                />
                <div className={`absolute top-4 left-4 text-[10px] font-alt uppercase tracking-widest ${v.inverse ? "text-secondary-foreground/60" : "text-muted-foreground"}`}>
                  {v.subtitle}
                </div>
              </div>
              <div className={`px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t ${v.inverse ? "border-secondary-glow/30 bg-secondary" : "border-border bg-card"}`}>
                <p className={`font-display font-semibold text-sm md:text-base ${v.inverse ? "text-secondary-foreground" : "text-foreground"}`}>{v.title}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(`${v.title} SVG`)}
                    className={`text-[10px] font-alt uppercase tracking-widest px-3 py-1.5 rounded-full border transition-smooth ${v.inverse ? "border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" : "border-border text-foreground/70 hover:bg-muted"}`}
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => handleDownload(`${v.title} PNG`)}
                    className="text-[10px] font-alt uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-glow transition-smooth flex items-center gap-1 justify-center"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Icons */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 gap-3">
          <h3 className="font-display text-2xl font-semibold text-foreground">Pustaka Ikon Umrah</h3>
          <p className="font-alt text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">Line Art · 2px Stroke · Konsisten</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {iconList.map((item) => {
            const Icon = item.icon === "Kaaba" ? KaabaIcon : (ICON_MAP[item.icon] ?? Star);
            return (
              <div
                key={item.name}
                className="group rounded-2xl bg-card border border-border p-4 md:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-elegant hover:-translate-y-1 transition-smooth"
              >
                <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-accent-soft/50 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-smooth text-secondary overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <Icon className="h-6 w-6 md:h-8 md:w-8" strokeWidth={1.5} />
                  )}
                </div>
                <p className="font-display font-semibold text-xs md:text-sm text-foreground truncate w-full px-1">{item.name}</p>
                <p className="text-[9px] md:text-[10px] font-alt uppercase tracking-widest text-muted-foreground mt-1 truncate w-full px-1">{item.desc}</p>
                <button
                  onClick={() => handleDownload(item.name)}
                  className="mt-4 text-[10px] font-alt uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-smooth flex items-center gap-1"
                >
                  <Download className="h-3 w-3" /> SVG
                </button>
              </div>
            );
          })}
        </div>

        {/* Graphics / Vector Accents */}
        {graphicList.length > 0 && (
          <>
            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-8 mt-20 gap-3">
              <h3 className="font-display text-2xl font-semibold text-foreground">Elemen Visual & Aksen Vector</h3>
              <p className="font-alt text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">AI Generated · Sesuai Brand Kit</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {graphicList.map((g, i) => (
                <div
                  key={`${g.name}-${i}`}
                  className="group rounded-2xl bg-card border border-border p-3 flex flex-col items-center text-center shadow-sm hover:shadow-elegant hover:-translate-y-1 transition-smooth"
                >
                  <div
                    className="w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden mb-3"
                    style={{
                      backgroundImage:
                        "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
                      backgroundSize: "12px 12px",
                      backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                    }}
                  >
                    <img src={g.image_url} alt={g.name} className="w-full h-full object-contain p-2" />
                  </div>
                  <p className="font-display font-semibold text-xs text-foreground truncate w-full px-1">{g.name}</p>
                  <p className="text-[9px] font-alt uppercase tracking-widest text-muted-foreground mt-1 truncate w-full px-1">
                    {g.kind} · {g.style}
                  </p>
                  <a
                    href={g.image_url}
                    download
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-[10px] font-alt uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-smooth flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> PNG
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AssetEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </section>
  );
};

export default AssetGallery;
