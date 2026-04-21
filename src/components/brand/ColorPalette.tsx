import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

type Color = {
  name: string;
  role: string;
  hex: string;
  rgb: string;
  hsl: string;
  textOn?: "light" | "dark";
  category: "primary" | "secondary" | "accent" | "neutral";
};

const colors: Color[] = [
  { name: "Maroon Deep", role: "Primary Deep", hex: "#5C0A18", rgb: "92, 10, 24", hsl: "354 80% 22%", textOn: "light", category: "primary" },
  { name: "Maroon", role: "Primary", hex: "#8E1428", rgb: "142, 20, 40", hsl: "354 75% 32%", textOn: "light", category: "primary" },
  { name: "Maroon Glow", role: "Primary Glow", hex: "#C13449", rgb: "193, 52, 73", hsl: "354 70% 45%", textOn: "light", category: "primary" },
  { name: "Navy Deep", role: "Secondary", hex: "#101F4C", rgb: "16, 31, 76", hsl: "220 65% 18%", textOn: "light", category: "secondary" },
  { name: "Navy", role: "Secondary Glow", hex: "#22386F", rgb: "34, 56, 111", hsl: "220 55% 30%", textOn: "light", category: "secondary" },
  { name: "Royal Gold", role: "Accent", hex: "#C99A3F", rgb: "201, 154, 63", hsl: "38 55% 52%", textOn: "dark", category: "accent" },
  { name: "Gold Soft", role: "Accent Soft", hex: "#F5E6C5", rgb: "245, 230, 197", hsl: "38 70% 88%", textOn: "dark", category: "accent" },
  { name: "Ivory", role: "Background", hex: "#FBF8F3", rgb: "251, 248, 243", hsl: "40 33% 98%", textOn: "dark", category: "neutral" },
  { name: "Stone", role: "Muted", hex: "#EFEBE3", rgb: "239, 235, 227", hsl: "40 20% 94%", textOn: "dark", category: "neutral" },
  { name: "Ink", role: "Foreground", hex: "#111A2C", rgb: "17, 26, 44", hsl: "220 45% 12%", textOn: "light", category: "neutral" },
];

const tailwindSnippet = `// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: "hsl(354 75% 32%)",  // Maroon
    deep: "hsl(354 80% 22%)",
    glow: "hsl(354 70% 45%)",
  },
  secondary: {
    DEFAULT: "hsl(220 65% 18%)",  // Navy
    glow: "hsl(220 55% 30%)",
  },
  accent: {
    DEFAULT: "hsl(38 55% 52%)",   // Gold
    soft: "hsl(38 70% 88%)",
  },
}`;

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
      <div
        className="relative h-36 w-full"
        style={{ backgroundColor: color.hex }}
      >
        <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-smooth ${color.textOn === "light" ? "text-white" : "text-foreground"}`}>
          {copied ? <Check className="h-8 w-8" /> : <Copy className="h-7 w-7" />}
        </div>
        <div className={`absolute top-3 left-3 text-[10px] font-alt uppercase tracking-widest ${color.textOn === "light" ? "text-white/70" : "text-foreground/50"}`}>
          {color.role}
        </div>
      </div>
      <div className="p-4 space-y-1">
        <div className="font-display text-lg font-semibold text-foreground">{color.name}</div>
        <div className="font-mono text-sm text-primary">{color.hex}</div>
        <div className="font-mono text-[11px] text-muted-foreground">rgb({color.rgb})</div>
      </div>
    </button>
  );
};

const ColorPalette = () => {
  const [snippetCopied, setSnippetCopied] = useState(false);
  const groups = [
    { title: "Warna Utama", subtitle: "Primary — Maroon", cat: "primary" as const },
    { title: "Warna Sekunder", subtitle: "Secondary — Navy", cat: "secondary" as const },
    { title: "Aksen", subtitle: "Accent — Royal Gold", cat: "accent" as const },
    { title: "Netral", subtitle: "Neutrals", cat: "neutral" as const },
  ];

  return (
    <section id="colors" className="py-24 bg-background">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-4">02 — Color System</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">Palet Warna</h2>
          <p className="text-lg text-muted-foreground">
            Warna brand mencerminkan keagungan, kepercayaan, dan kehangatan dalam pelayanan ibadah. Klik kartu untuk menyalin kode warna.
          </p>
        </div>

        <div className="space-y-12">
          {groups.map((g) => (
            <div key={g.cat}>
              <div className="flex items-baseline gap-4 mb-6">
                <h3 className="font-display text-2xl font-semibold text-foreground">{g.title}</h3>
                <span className="font-alt text-xs uppercase tracking-widest text-muted-foreground">{g.subtitle}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {colors.filter((c) => c.category === g.cat).map((c) => (
                  <ColorCard key={c.hex} color={c} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tailwind Snippet */}
        <div className="mt-16 rounded-2xl bg-secondary text-secondary-foreground overflow-hidden shadow-navy">
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-glow/30">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-destructive/70" />
                <span className="h-3 w-3 rounded-full bg-accent/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
              </div>
              <span className="font-mono text-xs text-secondary-foreground/60">tailwind.config.ts</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(tailwindSnippet);
                setSnippetCopied(true);
                toast.success("Snippet disalin!");
                setTimeout(() => setSnippetCopied(false), 2000);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-secondary-glow/40 px-3 py-1.5 text-xs hover:bg-secondary-glow/60 transition-smooth"
            >
              {snippetCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {snippetCopied ? "Disalin" : "Salin"}
            </button>
          </div>
          <pre className="p-6 overflow-x-auto font-mono text-sm leading-relaxed">
            <code className="text-secondary-foreground/90">{tailwindSnippet}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};

export default ColorPalette;
