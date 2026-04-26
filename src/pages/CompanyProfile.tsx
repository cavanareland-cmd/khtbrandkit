import { Link } from "react-router-dom";
import {
  Sparkles,
  Compass,
  ShieldCheck,
  HeartHandshake,
  Plane,
  Hotel,
  Users,
  Award,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Star,
  Building2,
  BookOpen,
  Moon,
} from "lucide-react";
import logo from "@/assets/karin-logo.png";
import heroKaaba from "@/assets/company-hero-kaaba.jpg";
import madinah from "@/assets/company-madinah.jpg";
import jamaah from "@/assets/company-jamaah.jpg";
import hotelImg from "@/assets/company-hotel.jpg";
import Header from "@/components/brand/Header";
import Footer from "@/components/brand/Footer";

const stats = [
  { value: "10+", label: "Tahun Pengalaman", icon: Award },
  { value: "5,000+", label: "Jamaah Terlayani", icon: Users },
  { value: "98%", label: "Tingkat Kepuasan", icon: Star },
  { value: "12+", label: "Mitra Hotel ★★★★★", icon: Building2 },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Amanah",
    desc: "Setiap kepercayaan jamaah kami jaga dengan penuh tanggung jawab — dari niat awal hingga kembali ke tanah air.",
  },
  {
    icon: HeartHandshake,
    title: "Khidmat",
    desc: "Pelayanan tulus, ramah, dan personal. Kami memuliakan tamu Allah seperti memuliakan keluarga sendiri.",
  },
  {
    icon: Sparkles,
    title: "Kenyamanan",
    desc: "Akomodasi premium, transportasi terjadwal rapi, dan pendampingan penuh agar ibadah lebih khusyuk.",
  },
  {
    icon: Compass,
    title: "Bimbingan Manasik",
    desc: "Dipandu pembimbing bersertifikat sesuai sunnah, dengan kurikulum manasik yang terstruktur.",
  },
];

const programs = [
  {
    badge: "Paling Diminati",
    title: "Umrah Reguler 9 Hari",
    desc: "Paket esensial dengan keberangkatan rutin dari Jakarta. Hotel ★★★★ dekat Masjidil Haram & Masjid Nabawi.",
    features: ["Direct Flight", "Hotel ★★★★ < 500m", "Manasik 3x", "Muthawwif Senior"],
    accent: "primary",
  },
  {
    badge: "Spesial",
    title: "Umrah Plus Turki / Aqsa",
    desc: "Sempurnakan perjalanan dengan ziarah ke Istanbul atau Masjidil Aqsa. Perpanjangan 4-6 hari.",
    features: ["Hotel ★★★★★", "City Tour Lengkap", "Tour Guide Lokal", "Visa Multi-Entry"],
    accent: "secondary",
  },
  {
    badge: "Premium",
    title: "Haji Plus Khusus",
    desc: "Program haji dengan layanan eksklusif, kuota terbatas, dan akomodasi terdekat dengan Masjidil Haram.",
    features: ["Maktab VIP", "Tenda Mina ber-AC", "Hotel < 200m", "Pembimbing 24/7"],
    accent: "accent",
  },
];

const milestones = [
  { year: "2014", text: "PT Karin Hidayah Tour didirikan dengan misi menjadi mitra terpercaya tamu Allah." },
  { year: "2017", text: "Mendapatkan izin resmi PPIU & PIHK dari Kementerian Agama RI." },
  { year: "2019", text: "Memberangkatkan jamaah ke-1.000 dengan tingkat kepuasan 98%." },
  { year: "2022", text: "Membuka program Umrah Plus Turki dan Al-Aqsa secara reguler." },
  { year: "2024", text: "Diversifikasi kuota Haji Plus dan kemitraan strategis dengan hotel premium di Mekkah & Madinah." },
];

const testimonials = [
  {
    name: "H. Ahmad Fauzi",
    role: "Jamaah Umrah 2024",
    quote: "Pelayanan luar biasa, pembimbing sabar, hotel sangat dekat dengan Masjidil Haram. Insya Allah tahun depan ikut lagi bersama keluarga.",
  },
  {
    name: "Hj. Siti Aminah",
    role: "Jamaah Umrah Plus Turki",
    quote: "Perjalanan paling berkesan dalam hidup. Tim KHT memperhatikan detail sekecil apapun, mulai dari makanan hingga kursi roda untuk ibu saya.",
  },
  {
    name: "H. Budi Santoso",
    role: "Jamaah Haji Plus 2023",
    quote: "Amanah dan profesional. Sejak pendaftaran hingga kepulangan, semua transparan dan tepat waktu. Barakallah untuk tim Karin Hidayah Tour.",
  },
];

const CompanyProfile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroKaaba}
            alt="Pemandangan Ka'bah di Masjidil Haram saat golden hour"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-secondary/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container relative py-28 md:py-40 lg:py-48">
          <div className="max-w-3xl text-secondary-foreground space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 backdrop-blur-sm px-4 py-1.5 text-xs font-alt font-medium uppercase tracking-[0.25em] text-accent-soft">
              <Moon className="h-3 w-3" />
              Company Profile · Sejak 2014
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
              Memuliakan
              <br />
              <span className="text-accent italic">Tamu Allah</span>
              <br />
              dengan Penuh Khidmat.
            </h1>

            <p className="font-display italic text-xl md:text-2xl text-secondary-foreground/85 max-w-2xl leading-relaxed">
              "Labbaik Allahumma Labbaik" — kami menemani langkah pertama hingga doa terakhir Anda di Tanah Suci.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#programs"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground shadow-elegant hover:shadow-glow transition-smooth"
              >
                Lihat Program Kami
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/30 bg-secondary-foreground/5 backdrop-blur-sm px-7 py-3.5 text-sm font-medium text-secondary-foreground hover:bg-secondary-foreground/10 transition-smooth"
              >
                Hubungi Kami
              </a>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="container relative -mt-12 md:-mt-16 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50 rounded-2xl overflow-hidden shadow-elegant border border-border/50">
            {stats.map((s) => (
              <div key={s.label} className="bg-card p-6 md:p-8 flex flex-col items-center text-center gap-2">
                <s.icon className="h-5 w-5 text-accent mb-1" />
                <div className="font-display text-3xl md:text-4xl font-bold text-primary">{s.value}</div>
                <div className="text-xs md:text-sm font-alt uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TENTANG KAMI */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 arabesque-pattern opacity-50" />
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="relative">
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-elegant">
                <img
                  src={madinah}
                  alt="Masjid Nabawi dengan kubah hijau saat blue hour"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={1024}
                  height={1024}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/40 to-transparent" />
              </div>
              <div className="absolute -bottom-8 -right-8 hidden md:block w-48 aspect-square rounded-3xl bg-card shadow-elegant p-6 border border-border">
                <img src={logo} alt="Logo KHT" className="w-full h-full object-contain" />
              </div>
              <div className="absolute -top-6 -left-6 hidden md:flex h-24 w-24 rounded-full bg-accent items-center justify-center shadow-elegant">
                <p className="font-display text-center text-accent-foreground text-xs leading-tight">
                  Sejak<br /><span className="text-2xl font-bold">2014</span>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 border border-primary/20 px-4 py-1.5 text-xs font-alt uppercase tracking-[0.25em] text-primary">
                <BookOpen className="h-3 w-3" /> Tentang Kami
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary leading-tight">
                Lebih dari satu dekade <span className="text-primary italic">menemani perjalanan suci</span>.
              </h2>
              <p className="text-lg text-foreground/75 leading-relaxed">
                <strong>PT Karin Hidayah Tour</strong> adalah penyelenggara perjalanan ibadah Umrah dan Haji Khusus
                yang resmi terdaftar di Kementerian Agama Republik Indonesia. Kami berkomitmen menghadirkan
                pengalaman ibadah yang <em>amanah, khidmat, dan nyaman</em> bagi setiap tamu Allah.
              </p>
              <p className="text-base text-foreground/70 leading-relaxed">
                Dipercaya oleh ribuan jamaah dari seluruh nusantara, kami memadukan ketelitian operasional
                dengan sentuhan kekeluargaan — agar setiap langkah Anda di Tanah Suci dipenuhi keberkahan.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-4">
                {[
                  "Berizin Resmi PPIU & PIHK",
                  "Pembimbing Bersertifikat",
                  "Hotel Premium ★★★★+",
                  "Direct Flight Garuda / Saudia",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISI MISI */}
      <section className="py-24 md:py-28 bg-gradient-to-br from-secondary via-secondary to-secondary-glow text-secondary-foreground relative overflow-hidden">
        <div className="absolute inset-0 arabesque-pattern opacity-20" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

        <div className="container relative">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent">Visi & Misi</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Arah <span className="italic text-accent">perjalanan</span> kami.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-secondary-foreground/5 backdrop-blur-sm border border-secondary-foreground/10 p-10 hover:bg-secondary-foreground/10 transition-smooth">
              <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
                <Compass className="h-6 w-6 text-accent" />
              </div>
              <p className="font-alt text-xs uppercase tracking-widest text-accent mb-3">Visi</p>
              <p className="font-display italic text-2xl leading-relaxed">
                "Menjadi mitra perjalanan ibadah pilihan utama umat Islam Indonesia, dengan pelayanan yang
                amanah, profesional, dan berlandaskan sunnah."
              </p>
            </div>

            <div className="rounded-3xl bg-secondary-foreground/5 backdrop-blur-sm border border-secondary-foreground/10 p-10 hover:bg-secondary-foreground/10 transition-smooth">
              <div className="h-14 w-14 rounded-2xl bg-accent/20 flex items-center justify-center mb-6">
                <Star className="h-6 w-6 text-accent" />
              </div>
              <p className="font-alt text-xs uppercase tracking-widest text-accent mb-3">Misi</p>
              <ul className="space-y-3 text-secondary-foreground/85">
                <li className="flex gap-3"><span className="text-accent">◆</span> Menyelenggarakan ibadah Umrah & Haji yang khusyuk dan tertib.</li>
                <li className="flex gap-3"><span className="text-accent">◆</span> Memberikan pendampingan manasik sesuai tuntunan sunnah.</li>
                <li className="flex gap-3"><span className="text-accent">◆</span> Menjaga transparansi biaya & jadwal keberangkatan.</li>
                <li className="flex gap-3"><span className="text-accent">◆</span> Menghadirkan pengalaman premium dengan harga yang adil.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* NILAI-NILAI */}
      <section className="py-24 md:py-32">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-primary">Nilai Kami</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary leading-tight">
              Empat pilar <span className="italic text-primary">pelayanan</span>.
            </h2>
            <p className="text-foreground/70 text-lg">
              Setiap detail kami rancang berlandaskan empat nilai utama yang menjadi DNA brand Karin Hidayah Tour.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, idx) => (
              <div
                key={v.title}
                className="group relative rounded-2xl bg-card border border-border p-8 hover:border-primary/40 hover:shadow-elegant transition-smooth overflow-hidden"
              >
                <div className="absolute top-0 right-0 font-display text-7xl font-bold text-primary/5 leading-none p-4">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-bounce">
                    <v.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-secondary mb-3">{v.title}</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAM */}
      <section id="programs" className="py-24 md:py-32 bg-gradient-soft relative">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-4 max-w-xl">
              <p className="font-alt text-xs uppercase tracking-[0.3em] text-primary">Program Unggulan</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary leading-tight">
                Pilih perjalanan <span className="italic text-primary">terbaik</span> Anda.
              </h2>
            </div>
            <p className="text-foreground/70 max-w-md">
              Tiga program utama yang dirancang untuk berbagai kebutuhan — dari ibadah esensial hingga pengalaman
              premium dengan ziarah lintas negara.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {programs.map((p) => (
              <div
                key={p.title}
                className="group rounded-3xl bg-card border border-border overflow-hidden hover:shadow-elegant transition-smooth flex flex-col"
              >
                <div className="aspect-[4/3] bg-gradient-hero relative overflow-hidden">
                  <img
                    src={p.title.includes("Haji") ? heroKaaba : p.title.includes("Plus") ? hotelImg : madinah}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                    loading="lazy"
                    width={1280}
                    height={960}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent" />
                  <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-[10px] font-alt font-bold uppercase tracking-widest text-accent-foreground">
                    <Sparkles className="h-3 w-3" /> {p.badge}
                  </span>
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <h3 className="font-display text-2xl font-bold text-secondary mb-2">{p.title}</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed mb-5">{p.desc}</p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact"
                    className="inline-flex items-center justify-between gap-2 w-full rounded-xl bg-secondary text-secondary-foreground px-5 py-3 text-sm font-medium hover:bg-primary transition-smooth group/btn"
                  >
                    Konsultasi Program
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-smooth" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY / TIMELINE */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <div className="lg:sticky lg:top-32 space-y-6">
              <p className="font-alt text-xs uppercase tracking-[0.3em] text-primary">Perjalanan Kami</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary leading-tight">
                Satu dekade <span className="italic text-primary">amanah</span> & pertumbuhan.
              </h2>
              <p className="text-foreground/70 text-lg leading-relaxed">
                Dari kantor kecil hingga menjadi salah satu penyelenggara Umrah & Haji Plus terpercaya di Indonesia
                — perjalanan kami adalah cerminan kepercayaan jamaah.
              </p>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
                <div className="flex items-center gap-3 mb-2">
                  <Plane className="h-5 w-5 text-accent" />
                  <p className="font-alt text-xs uppercase tracking-widest text-muted-foreground">Pencapaian</p>
                </div>
                <p className="font-display text-3xl font-bold text-primary">5.000+ Jamaah</p>
                <p className="text-sm text-foreground/70 mt-1">Telah merasakan pelayanan Karin Hidayah Tour.</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-accent to-secondary" />
              <div className="space-y-10">
                {milestones.map((m) => (
                  <div key={m.year} className="relative pl-14">
                    <div className="absolute left-0 top-1 h-9 w-9 rounded-full bg-card border-2 border-primary flex items-center justify-center shadow-md">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <p className="font-display text-3xl font-bold text-primary mb-1">{m.year}</p>
                    <p className="text-foreground/75 leading-relaxed">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FASILITAS */}
      <section className="py-24 md:py-32 bg-secondary text-secondary-foreground relative overflow-hidden">
        <div className="absolute inset-0 arabesque-pattern opacity-20" />
        <div className="container relative">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent">Fasilitas Premium</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Kenyamanan dalam <span className="italic text-accent">setiap detail</span>.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Plane, title: "Direct Flight", desc: "Penerbangan langsung Garuda Indonesia & Saudia." },
              { icon: Hotel, title: "Hotel Bintang 4-5", desc: "Lokasi strategis dekat Masjidil Haram & Nabawi." },
              { icon: Users, title: "Muthawwif Senior", desc: "Pembimbing berpengalaman & berbahasa Indonesia." },
              { icon: ShieldCheck, title: "Asuransi & Visa", desc: "Pengurusan visa cepat dan asuransi jamaah." },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-secondary-foreground/5 backdrop-blur-sm border border-secondary-foreground/10 p-7 hover:bg-secondary-foreground/10 hover:border-accent/40 transition-smooth"
              >
                <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center mb-5">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-secondary-foreground/70 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONI */}
      <section className="py-24 md:py-32 bg-gradient-soft">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 items-center mb-16">
            <div className="lg:col-span-5 space-y-4">
              <p className="font-alt text-xs uppercase tracking-[0.3em] text-primary">Cerita Jamaah</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-secondary leading-tight">
                Suara <span className="italic text-primary">tamu Allah</span> yang telah pulang.
              </h2>
            </div>
            <div className="lg:col-span-7">
              <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-elegant">
                <img
                  src={jamaah}
                  alt="Foto kebersamaan jamaah Umrah Karin Hidayah Tour"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={1280}
                  height={896}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl bg-card border border-border p-7 hover:shadow-elegant transition-smooth flex flex-col"
              >
                <div className="flex gap-0.5 text-accent mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="font-display italic text-lg text-foreground/85 leading-relaxed mb-6 flex-1">
                  "{t.quote}"
                </p>
                <div className="pt-4 border-t border-border">
                  <p className="font-display font-bold text-secondary">{t.name}</p>
                  <p className="text-xs font-alt uppercase tracking-widest text-muted-foreground mt-1">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / KONTAK */}
      <section id="contact" className="py-24 md:py-32 relative overflow-hidden">
        <div className="container">
          <div className="relative rounded-[2rem] bg-gradient-hero p-10 md:p-16 lg:p-20 overflow-hidden shadow-elegant">
            <div className="absolute inset-0 arabesque-pattern opacity-20" />
            <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-glow/20 blur-3xl" />

            <div className="relative grid lg:grid-cols-2 gap-12 items-center text-secondary-foreground">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 backdrop-blur-sm px-4 py-1.5 text-xs font-alt uppercase tracking-[0.25em] text-accent-soft">
                  <Sparkles className="h-3 w-3" />
                  Konsultasi Gratis
                </div>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05]">
                  Siap menjadi <br />
                  <span className="text-accent italic">tamu Allah?</span>
                </h2>
                <p className="text-lg text-secondary-foreground/85 max-w-md leading-relaxed">
                  Tim kami siap membantu Anda memilih program yang sesuai. Konsultasikan kebutuhan keberangkatan
                  Umrah & Haji Anda sekarang.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground shadow-elegant hover:shadow-glow transition-smooth"
                  >
                    <Phone className="h-4 w-4" /> Chat WhatsApp
                  </a>
                  <Link
                    to="/studio"
                    className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/30 bg-secondary-foreground/5 backdrop-blur-sm px-7 py-3.5 text-sm font-medium text-secondary-foreground hover:bg-secondary-foreground/10 transition-smooth"
                  >
                    Buat Materi Promo <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { icon: MapPin, label: "Kantor Pusat", value: "Jakarta, Indonesia" },
                  { icon: Phone, label: "Telepon / WhatsApp", value: "+62 812-3456-7890" },
                  { icon: Mail, label: "Email Resmi", value: "info@karinhidayahtour.com" },
                  { icon: Building2, label: "Website", value: "karinhidayahtour.com" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-4 rounded-2xl bg-secondary-foreground/5 backdrop-blur-sm border border-secondary-foreground/10 p-5 hover:bg-secondary-foreground/10 transition-smooth"
                  >
                    <div className="h-11 w-11 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                      <c.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-alt uppercase tracking-widest text-secondary-foreground/60">
                        {c.label}
                      </p>
                      <p className="font-display text-lg font-medium truncate">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CompanyProfile;
