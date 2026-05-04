import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useBrandKit } from "@/hooks/useBrandKit";
import EditButton from "./admin/EditButton";
import ColorEditor from "./admin/ColorEditor";

type Color = {
  name: string;
  role: string;
  hex: string;
  rgb: string;
  hsl: string;
  textOn?: "light" | "dark";
  category: "primary" | "secondary" | "accent" | "neutral";
};

const ColorCard = ({ color }: { color: Color }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(color.hex);
    setCopied(true);
    toast.success(`${color.hex} disalin!`, { description: color.name });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card text-left transition-smooth hover:shadow-elegant hover:-translate-y-1"
    >
      <div className="relative h-28 md:h-36 w-full" style={{ backgroundColor: color.hex }}>
        <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth ${color.textOn === "light" ? "text-white" : "text-foreground"}`}>
          {copied ? <Check className="h-6 w-6 md:h-8 md:w-8" /> : <Copy className="h-5 w-5 md:h-7 md:w-7" />}
        </div>
        <div className={`absolute top-2 left-2 md:top-3 md:left-3 text-[9px] md:text-[10px] font-alt uppercase tracking-widest ${color.textOn === "light" ? "text-white/70" : "text-foreground/50"}`}>
          {color.role}
        </div>
      </div>
      <div className="p-3 md:p-4 space-y-1">
        <div className="font-display text-sm md:text-lg font-semibold text-foreground truncate">{color.name}</div>
        <div className="font-mono text-xs md:text-sm text-primary">{color.hex}</div>
        <div className="font-mono text-[9px] md:text-[11px] text-muted-foreground truncate">rgb({color.rgb})</div>
      </div>
    </button>
  );
};

const ColorPalette = () => {
  const { entries } = useBrandKit("color");
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const colors: Color[] = entries.map((e) => e.data as unknown as Color);

  const groups = [
    { title: "Warna Utama", subtitle: "Primary — Maroon", cat: "primary" as const },
    { title: "Warna Sekunder", subtitle: "Secondary — Navy", cat: "secondary" as const },
    { title: "Aksen", subtitle: "Accent — Royal Gold", cat: "accent" as const },
    { title: "Netral", subtitle: "Neutrals", cat: "neutral" as const },
  ];

  const primary = colors.find((c) => c.role === "Primary");
  const primaryDeep = colors.find((c) => c.role === "Primary Deep");
  const primaryGlow = colors.find((c) => c.role === "Primary Glow");
  const secondary = colors.find((c) => c.role === "Secondary");
  const secondaryGlow = colors.find((c) => c.role === "Secondary Glow");
  const accent = colors.find((c) => c.role === "Accent");
  const accentSoft = colors.find((c) => c.role === "Accent Soft");

  const tailwindSnippet = `// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: "hsl(${primary?.hsl ?? "354 75% 32%"})",
    deep: "hsl(${primaryDeep?.hsl ?? "354 80% 22%"})",
    glow: "hsl(${primaryGlow?.hsl ?? "354 70% 45%"})",
  },
  secondary: {
    DEFAULT: "hsl(${secondary?.hsl ?? "220 65% 18%"})",
    glow: "hsl(${secondaryGlow?.hsl ?? "220 55% 30%"})",
  },
  accent: {
    DEFAULT: "hsl(${accent?.hsl ?? "38 55% 52%"})",
    soft: "hsl(${accentSoft?.hsl ?? "38 70% 88%"})",
  },
}`;

  return (
    <section id="colors" className="py-12 md:py-24 bg-background relative">
      <div className="container px-4 mx-auto">
        {/* Header: Diperbaiki agar tidak tumpang tindih di mobile (image_57e100.png) */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="font-alt text-[10px] md:text-xs uppercase tracking-[0.3em] text-accent mb-3 md:mb-4">
              02 — Color System
            </p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-secondary mb-4">
              Palet Warna
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Warna brand mencerminkan keagungan, kepercayaan, dan kehangatan dalam pelayanan ibadah. Klik kartu untuk menyalin kode warna.
            </p>
          </div>
          <div className="shrink-0">
            <EditButton onClick={() => setEditorOpen(true)} label="Edit Warna" />
          </div>
        </div>

        <div className="space-y-16 mt-8">
          {groups.map((g) => {
            const list = colors.filter((c) => c.category === g.cat);
            if (list.length === 0) return null;
            return (
              <div key={g.cat}>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-6">
                  <h3 className="font-display text-xl md:text-2xl font-semibold text-foreground">{g.title}</h3>
                  <span className="font-alt text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground">{g.subtitle}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {list.map((c) => <ColorCard key={c.hex + c.name} color={c} />)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tailwind Snippet: Responsif untuk layar kecil */}
        <div className="mt-16 rounded-2xl bg-secondary text-secondary-foreground overflow-hidden shadow-navy border border-secondary-glow/20">
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-secondary-glow/30">
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive/70" />
                <span className="h-3 w-3 rounded-full bg-accent/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
              </div>
              <span className="font-mono text-[10px] md:text-xs text-secondary-foreground/60">tailwind.config.ts</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tailwindSnippet);
                setSnippetCopied(true);
                toast.success("Snippet disalin!");
                setTimeout(() => setSnippetCopied(false), 2000);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-secondary-glow/40 px-3 py-1.5 text-[10px] md:text-xs hover:bg-secondary-glow/60 transition-smooth"
            >
              {snippetCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {snippetCopied ? "Disalin" : "Salin"}
            </button>
          </div>
          <pre className="p-4 md:p-6 overflow-x-auto font-mono text-[11px] md:text-sm leading-relaxed">
            <code className="text-secondary-foreground/90">{tailwindSnippet}</code>
          </pre>
        </div>
      </div>

      <ColorEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </section>
  );
};

export default ColorPalette;
