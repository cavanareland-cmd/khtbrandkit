import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Loader2, Download, RefreshCcw, ArrowLeft, Copy, ImageIcon, Wand2, LogOut, Image, Hash, FileText, LayoutTemplate } from "lucide-react";
import logo from "@/assets/karin-logo.png";
import CanvasEditor, { type TextLayer, FORMAT_DIMENSIONS } from "@/components/studio/CanvasEditor";
import LayeredCanvasEditor, { type Layer, type GlobalStyle, DEFAULT_GLOBAL_STYLE } from "@/components/studio/LayeredCanvasEditor";
import TemplatePicker from "@/components/studio/TemplatePicker";
import MediaLibrary from "@/components/studio/MediaLibrary";
import ProAdCreator from "@/components/studio/ProAdCreator";

const MEDIA_TYPES = [
  { value: "flyer", label: "Flyer Promosi" },
  { value: "poster", label: "Poster Event" },
  { value: "brochure", label: "Brosur Paket" },
  { value: "social_post", label: "Konten Sosmed" },
  { value: "story", label: "Story / Status" },
  { value: "announcement", label: "Pengumuman" },
];

const FORMATS = [
  { value: "instagram_post", label: "📷 Instagram Post (1:1)", desc: "1080×1080" },
  { value: "instagram_story", label: "📱 Story / WA Status (9:16)", desc: "1080×1920" },
  { value: "a4_portrait", label: "📄 Flyer A4 Portrait", desc: "A4 Print" },
  { value: "banner_landscape", label: "🖥️ Banner Landscape (16:9)", desc: "1920×1080" },
];

const TONES = [
  "Tenang & Khidmat",
  "Hangat & Kekeluargaan",
  "Berkelas & Premium",
  "Inspiratif & Memotivasi",
  "Informatif & Jelas",
];

interface AICopy {
  headline: string;
  subheadline: string;
  body: string;
  highlight: string;
  cta_text: string;
  hashtags: string[];
  caption_long: string;
  visual_prompt: string;
  color_suggestion: string;
}

const Studio = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [creationId, setCreationId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<"form" | "editor">("form");

  // Form state — defaults dari Brosur Paket Umroh November 2026
  const [title, setTitle] = useState("Paket Umroh Bulan November 2026");
  const [format, setFormat] = useState("a4_portrait");
  const [mediaType, setMediaType] = useState("brochure");
  const [packageName, setPackageName] = useState("Paket Umroh Reguler 13 Hari");
  const [departureDate, setDepartureDate] = useState("19 November 2026");
  const [price, setPrice] = useState("Mulai Rp 34.900.000 (Quad)");
  const [duration, setDuration] = useState("13 Hari");
  const [cta, setCta] = useState("Konsultasi & Booking: 0811-3107-707");
  const [additionalInfo, setAdditionalInfo] = useState(
    "Bonus: Free Kereta Cepat, Free Kereta Gantung Thaif, Free City Tour Madinah/Mekkah/Thaif, Free Nasi Mandhi.\nDP Rp 5.000.000.\nMaskapai: Lion Air (SUB - JED / JED - SUB).\nOffice: Karah Indah, Blok G1 Karah, Kec. Jambangan, Surabaya, Jawa Timur.\nWebsite: www.karinhidayahtour.com",
  );
  const [tone, setTone] = useState("Berkelas & Premium");

  // Field tambahan khusus brosur paket Umroh
  const [packageTierGoldPrice, setPackageTierGoldPrice] = useState("Rp 39.900.000");
  const [packageTierGoldStrike, setPackageTierGoldStrike] = useState("Rp 41.900.000");
  const [packageTierSilverPrice, setPackageTierSilverPrice] = useState("Rp 34.900.000");
  const [packageTierSilverStrike, setPackageTierSilverStrike] = useState("Rp 36.900.000");
  const [hotels, setHotels] = useState(
    "Hotel Madinah: Al Saha /Setaraf\nHotel Mekkah: Olayan Ajyad /Setaraf\nHotel Madinah: Al Mukhtara Golden /Setaraf\nHotel Mekkah: Wahad Ajyad /Setaraf",
  );
  const [included, setIncluded] = useState(
    "Tiket pesawat Sub-Jed PP\nVisa Umroh\nPerlengkapan Premium\nDokumentasi Foto & Video\nFree Handling Domestik & Internasional\nPremium Lounge Keberangkatan & Kedatangan\nTour Leader & Muthawif Berkompeten & Profesional\nBimbingan Manasik Umroh 2x\nMakan 3x Full Board\nAir Zamzam 5 Liter\nFree City Tour Madinah & Makkah\nFree City Tour Thaif\nFree Nasi Mandhi\nFree Kereta Cepat\nProgram Umroh 3x",
  );
  const [excluded, setExcluded] = useState("Paspor\nVaksin");
  const [downPayment, setDownPayment] = useState("Rp 5.000.000");
  const [airline, setAirline] = useState("Lion Air · SUB - JED / JED - SUB");
  const [contactPhone, setContactPhone] = useState("0811-3107-707");
  const [contactWebsite, setContactWebsite] = useState("www.karinhidayahtour.com");
  const [officeAddress, setOfficeAddress] = useState("Karah Indah, Blok G1 Karah, Kec. Jambangan, Surabaya, Jawa Timur");

  // AI output
  const [aiCopy, setAiCopy] = useState<AICopy | null>(null);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [showLogo, setShowLogo] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState("");

  // Template mode state
  const [studioMode, setStudioMode] = useState<"brief" | "template" | "pro">("pro");
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; name: string; analysis: Record<string, unknown> | null; status: string } | null>(null);
  const [templateMode, setTemplateMode] = useState<"inspiration" | "extract">("inspiration");
  const [templateGenerating, setTemplateGenerating] = useState(false);
  const [extractingBrief, setExtractingBrief] = useState(false);
  const [extractedBrief, setExtractedBrief] = useState<{ summary?: string; detected_text?: string } | null>(null);
  const [richLayers, setRichLayers] = useState<Layer[]>([]);
  const [globalStyle, setGlobalStyle] = useState<GlobalStyle>(DEFAULT_GLOBAL_STYLE);

  useEffect(() => {
    document.title = "Studio · Brand Kit · KHT";
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (editId && user) {
      loadCreation(editId);
    }
  }, [editId, user]);

  const loadCreation = async (id: string) => {
    const { data, error } = await supabase.from("creations").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      toast.error("Gagal memuat kreasi");
      return;
    }
    setCreationId(data.id);
    setTitle(data.title);
    setFormat(data.format);
    setMediaType(data.media_type);
    const input = (data.input_data as Record<string, string>) || {};
    setPackageName(input.package_name || "");
    setDepartureDate(input.departure_date || "");
    setPrice(input.price || "");
    setDuration(input.duration || "");
    setCta(input.cta || "");
    setAdditionalInfo(input.additional_info || "");
    setTone(input.tone || "Tenang & Khidmat");
    if (input.package_tier_gold_price) setPackageTierGoldPrice(input.package_tier_gold_price);
    if (input.package_tier_gold_strike) setPackageTierGoldStrike(input.package_tier_gold_strike);
    if (input.package_tier_silver_price) setPackageTierSilverPrice(input.package_tier_silver_price);
    if (input.package_tier_silver_strike) setPackageTierSilverStrike(input.package_tier_silver_strike);
    if (input.hotels) setHotels(input.hotels);
    if (input.included) setIncluded(input.included);
    if (input.excluded) setExcluded(input.excluded);
    if (input.down_payment) setDownPayment(input.down_payment);
    if (input.airline) setAirline(input.airline);
    if (input.contact_phone) setContactPhone(input.contact_phone);
    if (input.contact_website) setContactWebsite(input.contact_website);
    if (input.office_address) setOfficeAddress(input.office_address);
    if (data.ai_copy && Object.keys(data.ai_copy as object).length > 0) {
      setAiCopy(data.ai_copy as unknown as AICopy);
    }
    if (data.background_image_url) setBgUrl(data.background_image_url);
    if (data.text_layers && Array.isArray(data.text_layers) && data.text_layers.length > 0) {
      setLayers(data.text_layers as unknown as TextLayer[]);
      setStep("editor");
    } else if (data.background_image_url) {
      setStep("editor");
    }
    // Load rich layers (template mode)
    const dataAny = data as unknown as { elements?: Layer[]; global_style?: GlobalStyle; template_id?: string };
    if (dataAny.elements && Array.isArray(dataAny.elements) && dataAny.elements.length > 0) {
      setRichLayers(dataAny.elements);
      setStudioMode("template");
      setStep("editor");
    }
    if (dataAny.global_style) setGlobalStyle({ ...DEFAULT_GLOBAL_STYLE, ...dataAny.global_style });
  };

  const handleGenerateFromTemplate = async () => {
    if (!user) return;
    if (!selectedTemplate) { toast.error("Pilih template dulu"); return; }
    if (selectedTemplate.status !== "ready") { toast.error("Template belum dianalisis AI"); return; }
    if (!title.trim()) { toast.error("Isi judul dulu"); return; }
    setTemplateGenerating(true);
    try {
      const inputData = { title, headline: title, subheadline: packageName, body: departureDate, cta };
      let id = creationId;
      if (!id) {
        const { data, error } = await supabase.from("creations").insert({
          user_id: user.id, title, format, media_type: mediaType,
          input_data: inputData, status: "generating", template_id: selectedTemplate.id,
        }).select().single();
        if (error || !data) throw error || new Error("Insert failed");
        id = data.id;
        setCreationId(id);
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-from-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ creationId: id, templateId: selectedTemplate.id, format, mode: templateMode, inputData }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 402) toast.error("Kredit AI habis.");
        else if (res.status === 429) toast.error("Rate limit, coba lagi.");
        else toast.error(result.error || "Generate gagal");
        return;
      }
      setBgUrl(result.background_image_url);
      setRichLayers(result.elements || []);
      toast.success("Template di-generate!");
      setStep("editor");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setTemplateGenerating(false);
    }
  };

  const handleExtractBrief = async () => {
    if (!selectedTemplate) { toast.error("Pilih template dulu"); return; }
    setExtractingBrief(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-template-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ templateId: selectedTemplate.id }),
      });
      const result = await res.json();
      if (!res.ok) { toast.error(result.error || "Extract gagal"); return; }
      const b = result.brief as Record<string, string>;
      if (b.title) setTitle(b.title);
      if (b.package_name) setPackageName(b.package_name);
      if (b.departure_date) setDepartureDate(b.departure_date);
      if (b.price) setPrice(b.price);
      if (b.duration) setDuration(b.duration);
      if (b.cta) setCta(b.cta);
      if (b.additional_info) setAdditionalInfo(b.additional_info);
      if (b.tone) setTone(b.tone);
      if (b.media_type) setMediaType(b.media_type);
      setExtractedBrief({ summary: b.summary, detected_text: b.detected_text });
      toast.success("Brief diekstrak dari template ✨");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setExtractingBrief(false);
    }
  };

  const handleSaveRichLayers = async () => {
    if (!creationId) return;
    await supabase.from("creations").update({
      elements: richLayers as unknown as never,
      global_style: globalStyle as unknown as never,
      status: "ready",
    }).eq("id", creationId);
    toast.success("Tersimpan!");
  };

  const buildDefaultLayers = (copy: AICopy, fmt: string): TextLayer[] => {
    const isStory = fmt === "instagram_story";
    const isLandscape = fmt === "banner_landscape";
    const baseSize = isLandscape ? 72 : isStory ? 96 : 80;
    return [
      {
        id: crypto.randomUUID(),
        text: copy.headline,
        x: 50, y: isStory ? 30 : isLandscape ? 40 : 35,
        fontSize: baseSize,
        fontFamily: "display",
        color: "#FBF8F3",
        bold: true, italic: false,
        align: "center",
        width: 85,
      },
      {
        id: crypto.randomUUID(),
        text: copy.subheadline,
        x: 50, y: isStory ? 42 : isLandscape ? 55 : 48,
        fontSize: Math.round(baseSize * 0.4),
        fontFamily: "alt",
        color: "#C99A3F",
        bold: false, italic: false,
        align: "center",
        width: 75,
      },
      {
        id: crypto.randomUUID(),
        text: copy.highlight,
        x: 50, y: isStory ? 60 : isLandscape ? 70 : 62,
        fontSize: Math.round(baseSize * 0.55),
        fontFamily: "display",
        color: "#FBF8F3",
        bold: false, italic: true,
        align: "center",
        width: 80,
        bgColor: "#8E1428",
        bgOpacity: 0.9,
      },
      {
        id: crypto.randomUUID(),
        text: copy.cta_text,
        x: 50, y: isStory ? 80 : isLandscape ? 87 : 82,
        fontSize: Math.round(baseSize * 0.32),
        fontFamily: "alt",
        color: "#101F4C",
        bold: true, italic: false,
        align: "center",
        width: 50,
        bgColor: "#C99A3F",
        bgOpacity: 1,
      },
    ];
  };

  const handleGenerate = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }
    setGenerating(true);
    try {
      const inputData = {
        title, package_name: packageName, departure_date: departureDate,
        price, duration, cta, additional_info: additionalInfo, tone,
        package_tier_gold_price: packageTierGoldPrice,
        package_tier_gold_strike: packageTierGoldStrike,
        package_tier_silver_price: packageTierSilverPrice,
        package_tier_silver_strike: packageTierSilverStrike,
        hotels, included, excluded,
        down_payment: downPayment, airline,
        contact_phone: contactPhone, contact_website: contactWebsite,
        office_address: officeAddress,
      };

      let id = creationId;
      if (!id) {
        const { data, error } = await supabase.from("creations").insert({
          user_id: user.id,
          title, format, media_type: mediaType,
          input_data: inputData,
          status: "generating",
        }).select().single();
        if (error || !data) throw error || new Error("Insert failed");
        id = data.id;
        setCreationId(id);
      } else {
        await supabase.from("creations").update({
          title, format, media_type: mediaType, input_data: inputData, status: "generating",
        }).eq("id", id);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-promo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ creationId: id, format, mediaType, inputData }),
      });

      const result = await res.json();
      if (!res.ok) {
        if (res.status === 402) toast.error("Kredit AI habis. Tambah saldo di Settings → Cloud.");
        else if (res.status === 429) toast.error("Rate limit. Coba lagi sebentar.");
        else toast.error(result.error || "Generate gagal");
        setGenerating(false);
        return;
      }

      setAiCopy(result.ai_copy);
      if (result.background_image_url) setBgUrl(result.background_image_url);
      const newLayers = buildDefaultLayers(result.ai_copy, format);
      setLayers(newLayers);
      await supabase.from("creations").update({ text_layers: newLayers as unknown as never }).eq("id", id);

      toast.success("Konten berhasil di-generate!");
      setStep("editor");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!creationId || !aiCopy) return;
    setRegenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          creationId,
          format,
          prompt: customImagePrompt.trim() || aiCopy.visual_prompt,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "Regenerate gagal");
        return;
      }
      setBgUrl(result.background_image_url);
      toast.success("Background baru!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveLayers = async () => {
    if (!creationId) return;
    await supabase.from("creations").update({
      text_layers: layers as unknown as never,
      status: "ready",
    }).eq("id", creationId);
    toast.success("Tersimpan!");
  };

  const handleExport = async () => {
    if (!bgUrl) {
      toast.error("Belum ada background");
      return;
    }
    const dims = FORMAT_DIMENSIONS[format];
    const canvas = document.createElement("canvas");
    canvas.width = dims.w;
    canvas.height = dims.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    toast.loading("Mengekspor...", { id: "export" });

    try {
      // Load and draw background
      const bgImg = await loadImage(bgUrl);
      ctx.drawImage(bgImg, 0, 0, dims.w, dims.h);

      // Draw text layers
      for (const layer of layers) {
        const fontFamily = layer.fontFamily === "display" ? '"Playfair Display", serif'
          : layer.fontFamily === "body" ? "Inter, sans-serif"
          : "Montserrat, sans-serif";
        const weight = layer.bold ? "700" : "400";
        const style = layer.italic ? "italic" : "normal";
        ctx.font = `${style} ${weight} ${layer.fontSize}px ${fontFamily}`;
        ctx.textAlign = layer.align;
        ctx.textBaseline = "middle";

        const x = (layer.x / 100) * dims.w;
        const y = (layer.y / 100) * dims.h;
        const maxWidth = (layer.width / 100) * dims.w;

        // Wrap text
        const lines = wrapText(ctx, layer.text, maxWidth);
        const lineHeight = layer.fontSize * (layer.lineHeight ?? 1.15);
        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;

        // Background box
        if (layer.bgColor) {
          const padding = layer.fontSize * 0.4;
          const padX = layer.fontSize * 0.8;
          const widestLine = Math.max(...lines.map(l => ctx.measureText(l).width));
          const boxW = widestLine + padX * 2;
          const boxH = totalHeight + padding * 2;
          const boxX = layer.align === "left" ? x - padX : layer.align === "right" ? x - boxW + padX : x - boxW / 2;
          const boxY = startY - lineHeight / 2 - padding;
          const opacity = layer.bgOpacity ?? 1;
          ctx.fillStyle = hexWithOpacity(layer.bgColor, opacity);
          roundRect(ctx, boxX, boxY, boxW, boxH, 12);
          ctx.fill();
        } else {
          // text shadow
          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = 16;
          ctx.shadowOffsetY = 4;
        }

        ctx.fillStyle = layer.color;
        lines.forEach((line, i) => {
          ctx.fillText(line, x, startY + i * lineHeight);
        });
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      }

      // Logo
      if (showLogo) {
        try {
          const logoImg = await loadImage(logo);
          const logoSize = dims.w * 0.12;
          ctx.drawImage(logoImg, dims.w - logoSize - dims.w * 0.04, dims.h - logoSize - dims.w * 0.04, logoSize, logoSize);
        } catch (e) {
          console.warn("Logo load failed", e);
        }
      }

      // Download
      canvas.toBlob((blob) => {
        if (!blob) { toast.error("Export gagal"); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_${format}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Berhasil diunduh!", { id: "export" });
      }, "image/png", 0.95);
    } catch (e) {
      console.error(e);
      toast.error("Export gagal: " + (e instanceof Error ? e.message : "error"), { id: "export" });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Studio Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="KHT" className="h-9 w-9" />
              <div className="hidden sm:block">
                <p className="font-display font-bold text-sm leading-tight text-primary">Brand Kit Studio</p>
                <p className="text-[10px] font-alt uppercase tracking-widest text-muted-foreground">KHT · AI Promo Creator</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/gallery"><Button variant="ghost" size="sm">Galeri</Button></Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-1" /> Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setStudioMode("pro")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-alt uppercase tracking-widest border transition-smooth ${studioMode === "pro" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted/50"}`}
          >
            <Wand2 className="h-3 w-3" /> Pro Ad Creator
          </button>
          <button
            onClick={() => setStudioMode("brief")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-alt uppercase tracking-widest border transition-smooth ${studioMode === "brief" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted/50"}`}
          >
            <Sparkles className="h-3 w-3" /> AI Brief
          </button>
          <button
            onClick={() => setStudioMode("template")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-alt uppercase tracking-widest border transition-smooth ${studioMode === "template" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted/50"}`}
          >
            <LayoutTemplate className="h-3 w-3" /> Dari Template
          </button>
        </div>

        {studioMode === "pro" && (
          <div className="space-y-3">
            <div>
              <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-1">Pro Ad Creator</p>
              <h2 className="font-display text-3xl font-bold text-secondary">Editor Poster Profesional · 1080×1350</h2>
              <p className="text-muted-foreground text-sm mt-1">Drag &amp; drop layer, badge, inclusion box, footer brand. Ekspor ke PNG resolusi penuh.</p>
            </div>
            <ProAdCreator />
          </div>
        )}


        {/* Step Tabs (hidden in Pro mode) */}
        {studioMode !== "pro" && (
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setStep("form")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-alt uppercase tracking-widest transition-smooth ${step === "form" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              <span className="h-5 w-5 rounded-full bg-background/20 text-[10px] flex items-center justify-center">1</span>
              {studioMode === "template" ? "Pilih Template" : "Brief"}
            </button>
            <span className="h-px w-8 bg-border" />
            <button
              onClick={() => (aiCopy || richLayers.length > 0) && setStep("editor")}
              disabled={!aiCopy && richLayers.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-alt uppercase tracking-widest transition-smooth disabled:opacity-40 disabled:cursor-not-allowed ${step === "editor" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
            >
              <span className="h-5 w-5 rounded-full bg-background/20 text-[10px] flex items-center justify-center">2</span>
              Editor
            </button>
          </div>
        )}

        {step === "form" && studioMode === "template" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-2">Mode Template</p>
                <h2 className="font-display text-3xl font-bold text-secondary">Upload referensi & biarkan AI yang remix</h2>
                <p className="text-muted-foreground text-sm mt-2">Upload PNG/JPG/PDF. AI akan analisis layout, warna, dan komposisi untuk dipakai sebagai inspirasi atau di-extract jadi layer yang bisa diedit.</p>
              </div>
              <TemplatePicker selectedId={selectedTemplate?.id ?? null} onSelect={(t) => { setSelectedTemplate(t as never); setExtractedBrief(null); }} />

              {selectedTemplate && (
                <div className="bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-accent">AI Brief Extractor</p>
                      <h3 className="font-display text-lg font-bold text-secondary mt-1">Extract konten template jadi brief</h3>
                      <p className="text-xs text-muted-foreground mt-1">AI akan baca semua teks (OCR) & visual lalu mengisi otomatis form di bawah sebagai bahan kreasi baru.</p>
                    </div>
                    <Button onClick={handleExtractBrief} disabled={extractingBrief} size="sm" className="shrink-0 gap-2">
                      {extractingBrief ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      {extractingBrief ? "Mengekstrak..." : "Extract Brief"}
                    </Button>
                  </div>
                  {extractedBrief && (
                    <div className="space-y-2 pt-2 border-t border-accent/20">
                      {extractedBrief.summary && (
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Ringkasan Brief</p>
                          <p className="text-xs text-foreground leading-relaxed">{extractedBrief.summary}</p>
                        </div>
                      )}
                      {extractedBrief.detected_text && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Teks Terdeteksi (OCR)</summary>
                          <pre className="mt-2 p-2 bg-background/60 rounded text-[11px] whitespace-pre-wrap font-mono max-h-40 overflow-auto">{extractedBrief.detected_text}</pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Judul / Headline *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Umrah Ramadhan 2026" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Format Output</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMATS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sub-headline / Paket</Label>
                    <Input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="Umrah Plus Turki 12 Hari" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Detail (tanggal/harga)</Label>
                    <Input value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} placeholder="15 Maret 2026 · Mulai 32jt" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>CTA</Label>
                    <Input value={cta} onChange={(e) => setCta(e.target.value)} maxLength={50} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Mode AI</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setTemplateMode("inspiration")}
                        className={`p-3 rounded-lg border text-left text-xs ${templateMode === "inspiration" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <div className="font-semibold mb-1">✨ Inspirasi</div>
                        <div className="text-muted-foreground">Generate background BARU bergaya template + brand KHT</div>
                      </button>
                      <button onClick={() => setTemplateMode("extract")}
                        className={`p-3 rounded-lg border text-left text-xs ${templateMode === "extract" ? "border-primary bg-primary/5" : "border-border"}`}>
                        <div className="font-semibold mb-1">🧩 Extract & Edit</div>
                        <div className="text-muted-foreground">Pakai template asli + auto-deteksi layer untuk diedit</div>
                      </button>
                    </div>
                  </div>
                </div>
                <Button onClick={handleGenerateFromTemplate} disabled={templateGenerating || !selectedTemplate || !title.trim()}
                  className="w-full h-12 bg-gradient-primary text-primary-foreground" size="lg">
                  {templateGenerating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Generating...</> : <><Sparkles className="mr-2 h-5 w-5" />Generate dari Template</>}
                </Button>
              </div>
            </div>
            <aside className="space-y-4">
              <div className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground">
                <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Cara Kerja</p>
                <h3 className="font-display text-xl font-bold mb-4">3 Langkah</h3>
                <ol className="space-y-3 text-sm text-primary-foreground/85 list-decimal list-inside">
                  <li>Upload referensi visual (PNG/JPG/PDF)</li>
                  <li>AI analisis layout, warna, mood, & teks (OCR)</li>
                  <li>Edit per-layer + AI Rewrite teks pakai bahan dari Pustaka Media</li>
                </ol>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4">
                <MediaLibrary selectedIds={[]} onSelectionChange={() => {}} selectable={false} />
                <p className="text-[10px] text-muted-foreground mt-2 italic">Bahan ini bisa dipilih saat AI Rewrite text di editor.</p>
              </div>
            </aside>
          </div>
        )}

        {step === "form" && studioMode === "brief" && (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-2">Brief Kreatif</p>
                <h2 className="font-display text-3xl font-bold text-secondary">Ceritakan apa yang ingin Anda buat</h2>
                <p className="text-muted-foreground text-sm mt-2">AI akan generate copy, visual, dan layout sesuai brand KHT.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-md space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Judul / Tema *</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Promo Umrah Ramadhan 2026" maxLength={100} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Format Media *</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            <div className="flex flex-col"><span>{f.label}</span><span className="text-[10px] text-muted-foreground">{f.desc}</span></div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Jenis Konten</Label>
                    <Select value={mediaType} onValueChange={setMediaType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MEDIA_TYPES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Nama Paket</Label>
                    <Input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="Contoh: Umrah Plus Turki 12 Hari" maxLength={100} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Tanggal Keberangkatan</Label>
                    <Input value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} placeholder="Contoh: 15 Maret 2026" maxLength={50} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Harga</Label>
                    <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Contoh: Mulai Rp 32.000.000" maxLength={50} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Durasi</Label>
                    <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Contoh: 9 Hari 8 Malam" maxLength={50} />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Call to Action (CTA)</Label>
                    <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Contoh: Konsultasi Gratis Sekarang" maxLength={60} />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Tone</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Info Tambahan</Label>
                    <Textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Fasilitas khusus, bonus, persyaratan, atau detail lain..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  {/* === Field khusus Brosur Paket Umroh === */}
                  <div className="sm:col-span-2 pt-4 mt-2 border-t border-border">
                    <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Detail Brosur Paket Umroh</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Harga Paket Gold</Label>
                    <Input value={packageTierGoldPrice} onChange={(e) => setPackageTierGoldPrice(e.target.value)} placeholder="Rp 39.900.000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Harga Coret Gold</Label>
                    <Input value={packageTierGoldStrike} onChange={(e) => setPackageTierGoldStrike(e.target.value)} placeholder="Rp 41.900.000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Harga Paket Silver</Label>
                    <Input value={packageTierSilverPrice} onChange={(e) => setPackageTierSilverPrice(e.target.value)} placeholder="Rp 34.900.000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Harga Coret Silver</Label>
                    <Input value={packageTierSilverStrike} onChange={(e) => setPackageTierSilverStrike(e.target.value)} placeholder="Rp 36.900.000" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Daftar Hotel (1 baris per hotel)</Label>
                    <Textarea value={hotels} onChange={(e) => setHotels(e.target.value)} rows={4} maxLength={600} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Sudah Termasuk (1 baris per item)</Label>
                    <Textarea value={included} onChange={(e) => setIncluded(e.target.value)} rows={8} maxLength={1500} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tidak Termasuk (1 baris per item)</Label>
                    <Textarea value={excluded} onChange={(e) => setExcluded(e.target.value)} rows={8} maxLength={500} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Down Payment (DP)</Label>
                    <Input value={downPayment} onChange={(e) => setDownPayment(e.target.value)} placeholder="Rp 5.000.000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Maskapai</Label>
                    <Input value={airline} onChange={(e) => setAirline(e.target.value)} placeholder="Lion Air · SUB - JED / JED - SUB" />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Telepon / WhatsApp</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="0811-3107-707" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input value={contactWebsite} onChange={(e) => setContactWebsite(e.target.value)} placeholder="www.karinhidayahtour.com" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Alamat Office</Label>
                    <Textarea value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} rows={2} maxLength={300} />
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generating || !title.trim()}
                  className="w-full h-12 bg-gradient-primary text-primary-foreground hover:shadow-glow transition-smooth"
                  size="lg"
                >
                  {generating ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />AI sedang menyusun...</>
                  ) : (
                    <><Sparkles className="mr-2 h-5 w-5" />Generate dengan AI</>
                  )}
                </Button>
              </div>
            </div>

            {/* Side preview */}
            <aside className="space-y-4">
              <div className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground shadow-elegant sticky top-24">
                <p className="font-alt text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Brand Voice</p>
                <h3 className="font-display text-xl font-bold mb-4">AI mengikuti panduan KHT</h3>
                <ul className="space-y-2.5 text-sm text-primary-foreground/85">
                  <li className="flex gap-2"><span className="text-accent">✓</span>Bahasa tenang & hormat</li>
                  <li className="flex gap-2"><span className="text-accent">✓</span>Maroon, Navy, Gold palette</li>
                  <li className="flex gap-2"><span className="text-accent">✓</span>Playfair Display + Inter</li>
                  <li className="flex gap-2"><span className="text-accent">✓</span>Frasa Islami yang natural</li>
                  <li className="flex gap-2"><span className="text-destructive">✗</span>Tidak hard-sell / clickbait</li>
                </ul>
                <div className="mt-6 pt-6 border-t border-secondary-glow/30">
                  <p className="font-display italic text-primary-foreground/70 text-sm">
                    "Pelayanan Umrah Amanah & Nyaman"
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {step === "editor" && studioMode === "template" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-1">Layered Editor</p>
                <h2 className="font-display text-3xl font-bold text-secondary">{title || "Template Edit"}</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("form")} size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Brief</Button>
                <Button variant="outline" onClick={handleSaveRichLayers} size="sm">Simpan</Button>
              </div>
            </div>
            <LayeredCanvasEditor
              format={format}
              backgroundUrl={bgUrl || undefined}
              layers={richLayers}
              onChange={setRichLayers}
              logoUrl={logo}
              globalStyle={globalStyle}
              onGlobalStyleChange={setGlobalStyle}
              onResizeFormat={setFormat}
            />
          </div>
        )}

        {step === "editor" && studioMode === "brief" && aiCopy && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-1">Editor Visual</p>
                <h2 className="font-display text-3xl font-bold text-secondary">{title}</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("form")} size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Edit Brief
                </Button>
                <Button variant="outline" onClick={handleSaveLayers} size="sm">
                  Simpan
                </Button>
                <Button onClick={handleExport} size="sm" className="bg-gradient-primary text-primary-foreground">
                  <Download className="h-4 w-4 mr-1" /> Unduh PNG
                </Button>
              </div>
            </div>

            <Tabs defaultValue="canvas" className="w-full">
              <TabsList>
                <TabsTrigger value="canvas"><Image className="h-3 w-3 mr-1.5" />Canvas</TabsTrigger>
                <TabsTrigger value="ai"><Wand2 className="h-3 w-3 mr-1.5" />AI Brief</TabsTrigger>
                <TabsTrigger value="caption"><FileText className="h-3 w-3 mr-1.5" />Caption</TabsTrigger>
              </TabsList>

              <TabsContent value="canvas" className="mt-4">
                <CanvasEditor
                  format={format}
                  backgroundUrl={bgUrl || undefined}
                  layers={layers}
                  onChange={setLayers}
                  logoUrl={logo}
                  showLogo={showLogo}
                  onShowLogoChange={setShowLogo}
                />
              </TabsContent>

              <TabsContent value="ai" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-accent" />
                      <h4 className="font-display font-semibold">Background AI</h4>
                    </div>
                    {bgUrl && <img src={bgUrl} alt="" className="rounded-xl w-full aspect-square object-cover" />}
                    <Textarea
                      value={customImagePrompt}
                      onChange={(e) => setCustomImagePrompt(e.target.value)}
                      placeholder={aiCopy.visual_prompt || "Edit prompt untuk regenerate..."}
                      rows={4}
                      maxLength={500}
                      className="text-xs"
                    />
                    <Button onClick={handleRegenerateImage} disabled={regenerating} variant="outline" className="w-full">
                      {regenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
                      Regenerate Background
                    </Button>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-4">
                    <h4 className="font-display font-semibold">Copy yang di-generate</h4>
                    {[
                      ["Headline", aiCopy.headline],
                      ["Sub-headline", aiCopy.subheadline],
                      ["Highlight", aiCopy.highlight],
                      ["Body", aiCopy.body],
                      ["CTA", aiCopy.cta_text],
                    ].map(([label, val]) => (
                      <div key={label} className="space-y-1">
                        <p className="font-alt text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                        <div className="flex items-start gap-2">
                          <p className="text-sm flex-1 text-foreground">{val}</p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(val as string); toast.success("Disalin"); }}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="caption" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-semibold">Caption Panjang</h4>
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(aiCopy.caption_long); toast.success("Disalin"); }}>
                        <Copy className="h-3 w-3 mr-1" />Salin
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{aiCopy.caption_long}</p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-accent" />
                      <h4 className="font-display font-semibold">Hashtags</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiCopy.hashtags.map((tag, i) => (
                        <button
                          key={i}
                          onClick={() => { navigator.clipboard.writeText(`#${tag}`); toast.success(`#${tag} disalin`); }}
                          className="text-xs bg-muted hover:bg-primary hover:text-primary-foreground transition-smooth px-3 py-1.5 rounded-full"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => { navigator.clipboard.writeText(aiCopy.hashtags.map(t => `#${t}`).join(" ")); toast.success("Semua hashtag disalin"); }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Salin Semua
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

// ===== Helpers =====
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexWithOpacity(hex: string, opacity: number): string {
  const o = Math.round(opacity * 255).toString(16).padStart(2, "0");
  return `${hex}${o}`;
}

export default Studio;
