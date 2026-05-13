import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, ArrowRight, Loader2, Upload, Sparkles, FileImage,
  ImageIcon, Smartphone, Square as SquareIcon, MonitorPlay, Plane, Compass,
  Check, Wand2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import logo from "@/assets/karin-logo.png";
import IconCreatorDialog from "@/components/brand/IconCreatorDialog";
import GraphicCreatorDialog from "@/components/brand/GraphicCreatorDialog";

// ─── CATEGORIES & FORMATS ────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: "umrah_poster",
    title: "Poster / Brosur Paket Umrah",
    desc: "Promosi paket umrah lengkap dengan harga & fasilitas",
    icon: Plane,
    format: "1080x1350",
    accent: "from-primary/20 to-secondary/20",
  },
  {
    key: "hajj_poster",
    title: "Poster Paket Haji",
    desc: "Aset promosi paket haji premium & reguler",
    icon: Compass,
    format: "1080x1350",
    accent: "from-secondary/20 to-accent/20",
  },
  {
    key: "story_promo",
    title: "Story Promo (IG / WA)",
    desc: "Format vertikal 9:16 untuk story & status",
    icon: Smartphone,
    format: "1080x1920",
    accent: "from-accent/20 to-primary/20",
  },
  {
    key: "feed_square",
    title: "Feed Square",
    desc: "Format kotak 1:1 untuk Instagram Feed",
    icon: SquareIcon,
    format: "1080x1080",
    accent: "from-primary/20 to-accent/20",
  },
  {
    key: "social_universal",
    title: "Sosial Media Universal",
    desc: "Format multi-platform (FB, TikTok, X, dll)",
    icon: MonitorPlay,
    format: "1080x1350",
    accent: "from-secondary/20 to-primary/20",
  },
] as const;

type CategoryKey = typeof CATEGORIES[number]["key"];

interface TemplateRow {
  id: string;
  name: string;
  preview_url: string | null;
  file_url: string;
  file_type: string;
  status: string;
  category: string | null;
  format: string | null;
  analysis: Record<string, unknown> | null;
}

type Step = "category" | "template" | "form";

const Assets = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthSession();
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number] | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loadingTpl, setLoadingTpl] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState<TemplateRow | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [iconCreatorOpen, setIconCreatorOpen] = useState(false);
  const [graphicCreatorOpen, setGraphicCreatorOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [packageName, setPackageName] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [cta, setCta] = useState("Konsultasi Gratis Sekarang");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Aset · Pilih Template · KHT";
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const loadTemplates = useCallback(async (categoryKey: CategoryKey) => {
    setLoadingTpl(true);
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("category", categoryKey)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      toast.error("Gagal memuat template: " + error.message);
      setTemplates([]);
    } else {
      setTemplates((data ?? []) as unknown as TemplateRow[]);
    }
    setLoadingTpl(false);
  }, []);

  // Poll while any template is being analyzed
  useEffect(() => {
    if (!selectedCategory) return;
    const hasAnalyzing = templates.some(t => t.status === "analyzing");
    if (!hasAnalyzing) return;
    const id = setInterval(() => loadTemplates(selectedCategory.key), 4000);
    return () => clearInterval(id);
  }, [templates, selectedCategory, loadTemplates]);

  const handleSelectCategory = (cat: typeof CATEGORIES[number]) => {
    setSelectedCategory(cat);
    setStep("template");
    loadTemplates(cat.key);
  };

  const runAnalyze = useCallback(async (templateId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-template", {
        body: { templateId },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("AI selesai memetakan layer template ✨");
        if (selectedCategory) loadTemplates(selectedCategory.key);
      }
    } catch (e) {
      toast.error("AI analyze gagal: " + (e instanceof Error ? e.message : "error"));
    }
  }, [selectedCategory, loadTemplates]);

  const handleUpload = async (file: File) => {
    if (!user || !selectedCategory) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("File terlalu besar (max 25MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("templates")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const fileUrl = supabase.storage.from("templates").getPublicUrl(path).data.publicUrl;
      const previewUrl = file.type.startsWith("image/") ? fileUrl : null;

      const { data: inserted, error: insErr } = await supabase.from("templates").insert({
        user_id: user.id,
        name: file.name,
        file_url: fileUrl,
        preview_url: previewUrl,
        file_type: file.type || ext,
        original_format: ext,
        status: previewUrl ? "uploaded" : "needs_export",
        category: selectedCategory.key,
        format: selectedCategory.format,
      }).select().single();
      if (insErr) throw insErr;

      toast.success("Template diupload! AI sedang memetakan layer…");
      loadTemplates(selectedCategory.key);

      // Auto-trigger AI analysis untuk template gambar
      if (previewUrl && inserted?.id) {
        runAnalyze(inserted.id);
      }
    } catch (e) {
      toast.error("Upload gagal: " + (e instanceof Error ? e.message : "error"));
    } finally {
      setUploading(false);
    }
  };

  const handleReanalyze = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    toast.info("Memulai analisis ulang…");
    await runAnalyze(templateId);
  };

  const handleSelectTemplate = (t: TemplateRow) => {
    setSelectedTpl(t);
    setStep("form");
    if (!title) setTitle(`Promo ${selectedCategory?.title ?? ""}`);

    // Auto-prefill form dari hasil AI analysis (OCR teks per region)
    const analysis = (t.analysis ?? {}) as Record<string, unknown>;
    const regions = Array.isArray(analysis.regions) ? (analysis.regions as Array<Record<string, unknown>>) : [];
    if (regions.length > 0) {
      const headlineText = regions.find(r => r.type === "headline")?.detected_text as string | undefined;
      const subheadText = regions.find(r => r.type === "subheadline")?.detected_text as string | undefined;
      const bodyTexts = regions.filter(r => r.type === "body").map(r => r.detected_text as string).filter(Boolean);
      const ctaText = regions.find(r => r.type === "cta")?.detected_text as string | undefined;

      if (headlineText && !packageName) setPackageName(headlineText.replace(/PAKET\s+/i, "").trim());
      const allTxt = [headlineText, subheadText, ...bodyTexts].filter(Boolean).join(" ");
      const priceMatch = allTxt.match(/Rp\.?\s*[\d.,]+\s*(juta|jt|m)?/i);
      if (priceMatch && !price) setPrice(priceMatch[0]);
      const dateMatch = allTxt.match(/\d{1,2}\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+\d{4}/i);
      if (dateMatch && !departureDate) setDepartureDate(dateMatch[0]);
      const durMatch = allTxt.match(/\d+\s*-?\s*(hari|H)\b/i);
      if (durMatch && !duration) setDuration(durMatch[0]);
      if (bodyTexts.length > 0 && !inclusions) setInclusions(bodyTexts.join("\n"));
      if (ctaText && !cta.includes(ctaText)) setCta(ctaText);

      toast.success("Form di-prefill dari hasil AI analysis 🎯");
    }
  };

  const handleContinueToEditor = async () => {
    if (!user || !selectedCategory || !selectedTpl) return;
    if (!title.trim()) { toast.error("Isi judul aset dulu"); return; }
    setSubmitting(true);
    try {
      const inputData = {
        title,
        package_name: packageName,
        departure_date: departureDate,
        price,
        duration,
        inclusions: inclusions.split("\n").map(s => s.trim()).filter(Boolean),
        cta,
        category: selectedCategory.key,
        template_analysis: selectedTpl.analysis ?? null,
        template_preview_url: selectedTpl.preview_url,
      };
      const studioFormat =
        selectedCategory.format === "1080x1920" ? "instagram_story"
        : selectedCategory.format === "1080x1080" ? "instagram_post"
        : "instagram_post";

      const { data, error } = await supabase.from("creations").insert([{
        user_id: user.id,
        title,
        format: studioFormat,
        media_type: selectedCategory.key,
        input_data: inputData as unknown as Record<string, never>,
        template_id: selectedTpl.id,
        background_image_url: selectedTpl.preview_url || selectedTpl.file_url || undefined,
        status: "draft",
      }]).select().single();

      if (error || !data) throw error || new Error("Gagal membuat draft");
      toast.success("Draft dibuat. Lanjut ke editor…");
      navigate(`/studio?id=${data.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === "template") { setStep("category"); setSelectedCategory(null); }
    else if (step === "form") { setStep("template"); setSelectedTpl(null); }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="KHT" className="h-9 w-9" />
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-primary">Buat Aset</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Pilih Kategori → Template → Konten</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIconCreatorOpen(true)} className="gap-1.5">
              <Wand2 className="h-3.5 w-3.5" /> Icon Creator
            </Button>
            <Link to="/studio">
              <Button variant="ghost" size="sm" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Studio</Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="sm">Admin</Button>
            </Link>
          </div>
        </div>
      </header>
      <IconCreatorDialog open={iconCreatorOpen} onOpenChange={setIconCreatorOpen} />

      {/* Stepper */}
      <div className="container py-6">
        <div className="flex items-center gap-3 mb-8">
          {step !== "category" && (
            <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <StepDot active={step === "category"} done={step !== "category"} label="1. Kategori" />
            <div className="w-6 h-px bg-border" />
            <StepDot active={step === "template"} done={step === "form"} label="2. Template" />
            <div className="w-6 h-px bg-border" />
            <StepDot active={step === "form"} done={false} label="3. Konten" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── STEP 1: CATEGORY ─────────────────────────────────── */}
          {step === "category" && (
            <motion.div
              key="cat"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <div className="max-w-2xl mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-primary tracking-tight">
                  Mau buat aset apa hari ini?
                </h1>
                <p className="text-muted-foreground mt-2">
                  Pilih kategori, lalu pilih dari template senada brand Anda. Tinggal isi konten — selesai.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button
                      key={cat.key}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectCategory(cat)}
                      className={cn(
                        "relative text-left rounded-2xl border border-border bg-card p-6 overflow-hidden group hover:border-primary/40 hover:shadow-elegant transition-smooth",
                      )}
                    >
                      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-smooth", cat.accent)} />
                      <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-display text-lg font-semibold text-foreground mb-1">{cat.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{cat.desc}</p>
                        <Badge variant="outline" className="text-[10px] font-mono">{cat.format}</Badge>
                      </div>
                      <ArrowRight className="absolute top-6 right-6 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: TEMPLATE PICKER ──────────────────────────── */}
          {step === "template" && selectedCategory && (
            <motion.div
              key="tpl"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">Kategori terpilih</p>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">{selectedCategory.title}</h2>
                  <p className="text-sm text-muted-foreground">Pilih satu template senada brand Anda di bawah.</p>
                </div>
                <div>
                  <input
                    ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
                  />
                  <Button
                    variant="outline" className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload Template Baru
                  </Button>
                </div>
              </div>

              {loadingTpl ? (
                <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
              ) : templates.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                  <FileImage className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="font-display text-lg font-semibold mb-1">Belum ada template di kategori ini</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload template referensi pertama Anda untuk kategori "{selectedCategory.title}".
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Template Pertama
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {templates.slice(0, 10).map((t) => (
                    <motion.button
                      key={t.id}
                      whileHover={{ y: -3 }}
                      onClick={() => handleSelectTemplate(t)}
                      className={cn(
                        "group relative rounded-xl overflow-hidden border-2 bg-card text-left transition-smooth",
                        selectedTpl?.id === t.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50",
                      )}
                    >
                      <div className="aspect-[4/5] bg-muted">
                        {t.preview_url ? (
                          <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileImage className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{t.name}</p>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <div className="flex items-center gap-1 min-w-0">
                            {t.status === "ready" && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 gap-0.5">
                                <Sparkles className="w-2 h-2" /> AI Ready
                              </Badge>
                            )}
                            {t.status === "analyzing" && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 gap-0.5 border-primary/40 text-primary">
                                <Loader2 className="w-2 h-2 animate-spin" /> Menganalisis
                              </Badge>
                            )}
                            {t.status === "uploaded" && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5">Belum analisis</Badge>
                            )}
                            {t.status === "failed" && (
                              <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Gagal</Badge>
                            )}
                          </div>
                          {(t.status === "uploaded" || t.status === "failed" || t.status === "ready") && t.preview_url && (
                            <span
                              role="button"
                              onClick={(e) => handleReanalyze(e as unknown as React.MouseEvent, t.id)}
                              className="text-[9px] text-primary hover:underline cursor-pointer shrink-0"
                              title="Analisis ulang dengan AI"
                            >
                              {t.status === "ready" ? "Re-AI" : "Analisis"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-smooth pointer-events-none" />
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 3: CONTENT FORM ─────────────────────────────── */}
          {step === "form" && selectedCategory && selectedTpl && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-[400px_1fr] gap-6"
            >
              {/* Preview template */}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Template Terpilih</p>
                <Card className="overflow-hidden">
                  <div className="aspect-[4/5] bg-muted">
                    {selectedTpl.preview_url ? (
                      <img src={selectedTpl.preview_url} alt={selectedTpl.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileImage className="h-12 w-12 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t">
                    <p className="text-sm font-medium truncate">{selectedTpl.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCategory.title} · {selectedCategory.format}</p>
                  </div>
                </Card>
              </div>

              {/* Form */}
              <div>
                <h2 className="font-display text-2xl font-bold text-primary mb-1">Isi Konten Aset</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Isi field utama di bawah, lalu lanjut ke editor untuk penyesuaian visual.
                </p>

                <div className="space-y-4 max-w-2xl">
                  <div>
                    <Label htmlFor="title">Judul Aset *</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mis. Promo Umrah Februari" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pkg">Nama Paket</Label>
                      <Input id="pkg" value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="Paket Umrah Silver" />
                    </div>
                    <div>
                      <Label htmlFor="dur">Durasi</Label>
                      <Input id="dur" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="13 Hari" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="dep">Tanggal Berangkat</Label>
                      <Input id="dep" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} placeholder="15 Februari 2026" />
                    </div>
                    <div>
                      <Label htmlFor="price">Harga</Label>
                      <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Rp 34,9 Juta" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="incl">Fasilitas / Include (1 baris = 1 item)</Label>
                    <Textarea
                      id="incl" value={inclusions} onChange={(e) => setInclusions(e.target.value)}
                      placeholder={"Hotel ⭐⭐⭐⭐ dekat Haram\nMakan 3x sehari\nManasik & Muthowif\nVisa & Tiket Pesawat"}
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cta">Call To Action</Label>
                    <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={goBack}>
                      <ArrowLeft className="h-4 w-4 mr-1" /> Ganti Template
                    </Button>
                    <Button onClick={handleContinueToEditor} disabled={submitting} className="gap-2">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Lanjut ke Editor Kanvas
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-smooth",
        done ? "bg-primary text-primary-foreground border-primary"
        : active ? "bg-primary/10 text-primary border-primary"
        : "bg-muted text-muted-foreground border-border",
      )}>
        {done ? <Check className="h-3 w-3" /> : label[0]}
      </div>
      <span className={cn("text-xs font-medium", active || done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

export default Assets;
