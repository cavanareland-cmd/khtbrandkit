import { useState } from "react";
import { useBrandKit } from "@/hooks/useBrandKit";
import EditButton from "./admin/EditButton";
import TypographyEditor from "./admin/TypographyEditor";

type FontEntry = { name: string; role: string; className: string; weight: string; sample: string; desc: string };

const scale = [
  { tag: "H1", size: "60px / 3.75rem", className: "text-6xl font-bold", sample: "Pelayanan Amanah" },
  { tag: "H2", size: "48px / 3rem", className: "text-5xl font-bold", sample: "Mantapkan Niat Ibadah" },
  { tag: "H3", size: "36px / 2.25rem", className: "text-4xl font-semibold", sample: "Paket Umrah Premium" },
  { tag: "H4", size: "24px / 1.5rem", className: "text-2xl font-semibold", sample: "Bersama KHT" },
  { tag: "H5", size: "20px / 1.25rem", className: "text-xl font-medium", sample: "Manasik Terstruktur" },
];

const bodyScale = [
  { tag: "Body Large", size: "18px", className: "text-lg" },
  { tag: "Body", size: "16px", className: "text-base" },
  { tag: "Small", size: "14px", className: "text-sm" },
  { tag: "Caption", size: "12px", className: "text-xs uppercase tracking-widest" },
];

const Typography = () => {
  const { entries } = useBrandKit("typography");
  const [customText, setCustomText] = useState("Bersama KHT, Tunaikan Niat Suci");
  const [activeFont, setActiveFont] = useState<"display" | "body" | "alt">("display");
  const [editorOpen, setEditorOpen] = useState(false);

  const fonts: FontEntry[] = entries.map((e) => e.data as unknown as FontEntry);
  const displayName = fonts.find((f) => f.className === "font-display")?.name ?? "Playfair";
  const bodyName = fonts.find((f) => f.className === "font-body")?.name ?? "Inter";
  const altName = fonts.find((f) => f.className === "font-alt")?.name ?? "Montserrat";

  return (
    <section id="typography" className="py-24 bg-gradient-soft relative">
      <div className="container">
        <div className="max-w-2xl mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-4">03 — Typography</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary mb-4">Sistem Tipografi</h2>
            <p className="text-lg text-muted-foreground">
              Pasangan font yang elegan: {displayName} untuk judul yang bermartabat, {bodyName} untuk keterbacaan, {altName} untuk aksen modern.
            </p>
          </div>
          <EditButton onClick={() => setEditorOpen(true)} label="Edit Tipografi" />
        </div>

        {/* Font Families */}
        <div className="grid md:grid-cols-3 gap-6 mb-16 mt-8">
          {fonts.map((f) => (
            <div key={f.name + f.className} className="rounded-2xl bg-card border border-border p-8 shadow-md hover:shadow-elegant transition-smooth group">
              <div className={`${f.className} text-8xl text-primary mb-6 leading-none transition-smooth group-hover:scale-105 origin-left`}>
                {f.sample}
              </div>
              <div className="space-y-2">
                <p className="font-alt text-[10px] uppercase tracking-widest text-accent">{f.role}</p>
                <h3 className={`${f.className} text-2xl font-semibold text-foreground`}>{f.name}</h3>
                <p className="font-mono text-xs text-muted-foreground">Weights: {f.weight}</p>
                <p className="text-sm text-foreground/70 pt-2 border-t border-border">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Type Scale */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="rounded-2xl bg-card border border-border p-8 shadow-md">
            <h4 className="font-alt text-xs uppercase tracking-widest text-accent mb-6">Heading Scale — {displayName}</h4>
            <div className="space-y-6">
              {scale.map((s) => (
                <div key={s.tag} className="flex items-baseline justify-between gap-6 border-b border-border/50 pb-4 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className={`font-display ${s.className} text-secondary leading-tight truncate`}>{s.sample}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-semibold text-primary">{s.tag}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{s.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-8 shadow-md">
            <h4 className="font-alt text-xs uppercase tracking-widest text-accent mb-6">Body Scale — {bodyName}</h4>
            <div className="space-y-6">
              {bodyScale.map((s) => (
                <div key={s.tag} className="border-b border-border/50 pb-4 last:border-0">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="font-mono text-xs font-semibold text-primary">{s.tag}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{s.size}</p>
                  </div>
                  <p className={`font-body ${s.className} text-foreground/80`}>
                    Bismillahirrahmanirrahim — perjalanan ibadah yang berkah dimulai dengan niat yang tulus.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Tester */}
        <div className="rounded-3xl bg-secondary text-secondary-foreground p-8 md:p-12 shadow-navy relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-accent mb-2">Try it Live</p>
                <h3 className="font-display text-3xl font-bold">Uji Coba Font</h3>
                <p className="text-secondary-foreground/70 mt-1">Ketik teks Anda untuk melihat tampilan font brand.</p>
              </div>
              <div className="flex gap-2">
                {(["display", "body", "alt"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFont(f)}
                    className={`px-4 py-2 rounded-full text-xs font-alt uppercase tracking-widest transition-smooth ${
                      activeFont === f
                        ? "bg-accent text-accent-foreground shadow-md"
                        : "bg-secondary-glow/40 text-secondary-foreground/70 hover:bg-secondary-glow/60"
                    }`}
                  >
                    {f === "display" ? displayName : f === "body" ? bodyName : altName}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Ketik teks di sini..."
              className="w-full bg-transparent border-b-2 border-secondary-glow/50 focus:border-accent outline-none py-3 font-body text-base text-secondary-foreground placeholder:text-secondary-foreground/40 transition-smooth"
            />

            <div className="bg-secondary-glow/20 rounded-2xl p-8 md:p-12 min-h-[200px] flex items-center justify-center">
              <p className={`font-${activeFont} text-3xl md:text-5xl text-center leading-tight ${activeFont === "display" ? "italic" : ""}`}>
                {customText || "Ketik sesuatu..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <TypographyEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </section>
  );
};

export default Typography;
