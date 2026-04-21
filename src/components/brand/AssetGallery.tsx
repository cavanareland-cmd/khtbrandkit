import logo from "@/assets/karin-logo.png";
import { Download, Plane, Building2, Bus, Compass, BookOpen, MapPin } from "lucide-react";
import { toast } from "sonner";

const handleDownload = (name: string) => {
  toast.success(`Download ${name}`, { description: "Placeholder — file akan diunduh." });
};

const KaabaIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="14" y="20" width="36" height="34" rx="1" />
    <path d="M14 28h36" />
    <path d="M14 20l18-10 18 10" />
    <path d="M28 36h8v18h-8z" />
    <path d="M14 24h36" strokeDasharray="2 2" />
  </svg>
);

const logoVariants = [
  {
    title: "Logo Penuh",
    subtitle: "Primary Mark",
    bg: "bg-card",
    border: "border-border",
    inverse: false,
  },
  {
    title: "Versi Putih",
    subtitle: "On Dark Background",
    bg: "bg-secondary",
    border: "border-secondary",
    inverse: true,
  },
  {
    title: "Versi Maroon",
    subtitle: "On Light Background",
    bg: "bg-accent-soft",
    border: "border-accent/30",
    inverse: false,
  },
];

const icons = [
  { icon: KaabaIcon, name: "Ka'bah", desc: "Holy Site" },
  { icon: Plane, name: "Pesawat", desc: "Transportation" },
  { icon: Building2, name: "Hotel", desc: "Accommodation" },
  { icon: Bus, name: "Bus", desc: "Ground Transport" },
  { icon: Compass, name: "Manasik", desc: "Guidance" },
  { icon: BookOpen, name: "E-Guide", desc: "Digital Material" },
  { icon: MapPin, name: "Tour Spot", desc: "Locations" },
];

const AssetGallery = () => {
  return (
    <section id="assets" className="py-24 bg-background">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-4">04 — Visual Assets</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">Galeri Aset</h2>
          <p className="text-lg text-muted-foreground">
            Variasi logo dan ikonografi yang konsisten — siap digunakan di semua media komunikasi brand.
          </p>
        </div>

        {/* Logo Variants */}
        <h3 className="font-display text-2xl font-semibold text-foreground mb-6">Variasi Logo</h3>
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {logoVariants.map((v) => (
            <div key={v.title} className={`group rounded-2xl ${v.bg} ${v.border} border overflow-hidden shadow-md hover:shadow-elegant transition-smooth`}>
              <div className="aspect-square flex items-center justify-center p-12 relative">
                <img
                  src={logo}
                  alt={v.title}
                  className={`w-full h-full object-contain transition-smooth group-hover:scale-105 ${v.inverse ? "brightness-0 invert" : ""}`}
                />
                <div className={`absolute top-4 left-4 text-[10px] font-alt uppercase tracking-widest ${v.inverse ? "text-secondary-foreground/60" : "text-muted-foreground"}`}>
                  {v.subtitle}
                </div>
              </div>
              <div className={`px-6 py-4 flex items-center justify-between border-t ${v.inverse ? "border-secondary-glow/30 bg-secondary" : "border-border bg-card"}`}>
                <p className={`font-display font-semibold ${v.inverse ? "text-secondary-foreground" : "text-foreground"}`}>{v.title}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(`${v.title} SVG`)}
                    className={`text-[10px] font-alt uppercase tracking-widest px-3 py-1.5 rounded-full border transition-smooth ${v.inverse ? "border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" : "border-border text-foreground/70 hover:bg-muted"}`}
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => handleDownload(`${v.title} PNG`)}
                    className="text-[10px] font-alt uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-glow transition-smooth"
                  >
                    <Download className="h-3 w-3 inline mr-1" /> PNG
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Icons */}
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
          <h3 className="font-display text-2xl font-semibold text-foreground">Pustaka Ikon Umrah</h3>
          <p className="font-alt text-xs uppercase tracking-widest text-muted-foreground">Line Art · 2px Stroke · Konsisten</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {icons.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="group rounded-2xl bg-card border border-border p-6 flex flex-col items-center text-center shadow-sm hover:shadow-elegant hover:-translate-y-1 transition-smooth"
              >
                <div className="h-16 w-16 rounded-2xl bg-accent-soft/50 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-smooth text-secondary">
                  <Icon className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <p className="font-display font-semibold text-sm text-foreground">{item.name}</p>
                <p className="text-[10px] font-alt uppercase tracking-widest text-muted-foreground mt-1">{item.desc}</p>
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
      </div>
    </section>
  );
};

export default AssetGallery;
