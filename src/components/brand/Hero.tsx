import logo from "@/assets/karin-logo.png";
import { Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-soft">
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute inset-0 arabesque-pattern opacity-60" />
      
      {/* Decorative ornaments */}
      <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-alt font-medium uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" />
              Brand Identity Guidelines
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                <span className="text-secondary">PT Karin</span>
                <br />
                <span className="text-primary italic">Hidayah Tour</span>
              </h1>
              <div className="flex items-center gap-3">
                <div className="h-px w-12 bg-accent" />
                <p className="font-alt text-sm uppercase tracking-[0.3em] text-secondary/70">
                  Travel Umrah & Haji
                </p>
              </div>
            </div>

            <p className="text-xl md:text-2xl font-display italic text-foreground/80 leading-relaxed max-w-xl">
              "Pelayanan Umrah yang <span className="text-primary font-semibold not-italic">Amanah</span>, Khidmat, dan <span className="text-secondary font-semibold not-italic">Nyaman</span> bagi Setiap Tamu Allah."
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {["Amanah", "Khidmat", "Profesional", "Berpengalaman"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground/80 shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Logo Display */}
          <div className="relative flex items-center justify-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              {/* Concentric decorative rings */}
              <div className="absolute inset-0 -m-12 rounded-full border border-primary/10 animate-float" />
              <div className="absolute inset-0 -m-20 rounded-full border border-secondary/10" />
              <div className="absolute inset-0 -m-28 rounded-full border border-accent/10" />

              <div className="relative aspect-square w-[280px] md:w-[400px] rounded-3xl bg-card shadow-elegant flex items-center justify-center p-12 border border-border">
                <div className="absolute top-4 left-4 text-[10px] font-alt uppercase tracking-widest text-muted-foreground">Logo Utama</div>
                <div className="absolute bottom-4 right-4 text-[10px] font-alt uppercase tracking-widest text-muted-foreground">v1.0</div>
                <img src={logo} alt="Karin Hidayah Tour Logo" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
