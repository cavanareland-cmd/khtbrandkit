import logo from "@/assets/karin-logo.png";

const Footer = () => (
  <footer className="bg-secondary text-secondary-foreground relative overflow-hidden">
    <div className="absolute inset-0 arabesque-pattern opacity-30" />
    <div className="container relative py-16">
      <div className="grid md:grid-cols-3 gap-10 items-start">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="KHT" className="h-12 w-12 brightness-0 invert" />
            <div>
              <p className="font-wordmark text-lg font-bold">Karin Hidayah Tour</p>
              <p className="text-xs font-alt uppercase tracking-widest text-secondary-foreground/60">Brand Kit · v1.0</p>
            </div>
          </div>
          <p className="text-sm text-secondary-foreground/70 max-w-sm leading-relaxed">
            Brand Kit ini menjadi acuan resmi untuk seluruh produksi media komunikasi PT Karin Hidayah Tour.
          </p>
        </div>

        <div>
          <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Knowledge Base</p>
          <ul className="space-y-2 text-sm text-secondary-foreground/80">
            <li>Identitas Visual</li>
            <li>Sistem Warna & Tipografi</li>
            <li>Aset Logo & Ikon</li>
            <li>Panduan Suara Brand</li>
          </ul>
        </div>

        <div>
          <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Resmi</p>
          <a
            href="https://www.karinhidayahtour.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center font-display text-lg italic underline decoration-accent decoration-2 underline-offset-4 hover:text-accent transition-smooth"
          >
            karinhidayahtour.com →
          </a>
          <p className="mt-4 text-xs text-secondary-foreground/60">
            Berizin Resmi · Fasilitas Premium · Pendampingan Penuh
          </p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-secondary-glow/30 flex flex-col md:flex-row justify-between gap-4 items-center">
        <p className="text-xs text-secondary-foreground/50 font-alt">
          © {new Date().getFullYear()} PT Karin Hidayah Tour. All rights reserved.
        </p>
        <p className="text-xs text-secondary-foreground/50 font-display italic">
          "Labbaik Allahumma Labbaik"
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
