/**
 * ProAdCreator
 * ------------
 * Self-contained Pro-SaaS ad image creator for Travel & Umrah agencies.
 * - Fixed 1080x1350 canvas (Meta Ad ratio)
 * - Layer system: text, image, shape, badge, inclusion box, footer brand
 * - Image masking (circle clip)
 * - Pro typography: stroke, shadow, strikethrough pricing
 * - Drag/drop transform box (move + corner resize)
 * - Layer stack: visibility, lock, reorder
 * - Safe area overlay (Meta Ads)
 * - Export to PNG via html-to-image
 * - Default state: Paket Umroh Silver inspired template
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  Type, Image as ImageIcon, Square as SquareIcon, Tag, ListChecks, Phone,
  Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown, Trash2, Download,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Plus, Sparkles, Layers,
  Circle as CircleIcon, Square as SqOutline, MessageCircle, MapPin,
  Bot, Wand2, Copy, Check, PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import defaultBg from "@/assets/default-umroh-bg.jpg";

// ---- Constants ---------------------------------------------------------------
export const AD_W = 1080;
export const AD_H = 1350;
const SAFE_PCT = 5;

const FONTS = [
  { value: "inter", label: "Inter", css: "Inter, system-ui, sans-serif" },
  { value: "montserrat", label: "Montserrat", css: "Montserrat, system-ui, sans-serif" },
  { value: "playfair", label: "Playfair Display", css: "'Playfair Display', Georgia, serif" },
];

// ---- Types -------------------------------------------------------------------
type LayerKind = "text" | "image" | "shape" | "badge" | "inclusion" | "footer";

interface Base {
  id: string;
  kind: LayerKind;
  x: number; y: number;       // 0..1 (relative to canvas)
  w: number; h: number;       // 0..1
  rot: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  z: number;                  // logical z handled by array order; kept for export
}

interface TextL extends Base {
  kind: "text";
  text: string;
  font: string;          // FONTS.value
  size: number;          // px (relative to AD_H base = 1350)
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  lineHeight: number;
  strokeWidth: number;   // px
  strokeColor: string;
  shadowBlur: number;    // px
  shadowColor: string;
  shadowX: number; shadowY: number;
  pricingMode: boolean;  // strikethrough red
  letterSpacing: number; // px
}
interface ImageL extends Base {
  kind: "image";
  src: string | null;
  mask: "none" | "circle";
}
interface ShapeL extends Base {
  kind: "shape";
  shape: "rect" | "circle";
  fill: string;
  fillOpacity: number;
  radius: number;
}
interface BadgeL extends Base {
  kind: "badge";
  text: string;
  bg: string;
  fg: string;
  rounded: "pill" | "ribbon" | "tag";
}
interface InclusionL extends Base {
  kind: "inclusion";
  title: string;
  items: string[];     // bullet list
  columns: 1 | 2;
}
interface FooterL extends Base {
  kind: "footer";
  whatsapp: string;
  address: string;
  bg: string;
  fg: string;
}
type Layer = TextL | ImageL | ShapeL | BadgeL | InclusionL | FooterL;

// ---- Default Paket Umroh Silver template ------------------------------------
function defaultLayers(): Layer[] {
  const baseText: Omit<TextL, "id" | "kind" | "x" | "y" | "w" | "h" | "text"> = {
    rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    font: "playfair", size: 96, color: "#FBF8F3", bold: true, italic: false,
    align: "center", lineHeight: 1.05,
    strokeWidth: 3, strokeColor: "#FFFFFF",
    shadowBlur: 18, shadowColor: "rgba(0,0,0,0.55)", shadowX: 0, shadowY: 4,
    pricingMode: false, letterSpacing: 0,
  };
  return [
    {
      ...baseText, id: "headline", kind: "text",
      text: "PAKET UMROH SILVER",
      x: 0.06, y: 0.10, w: 0.88, h: 0.13,
      size: 110, strokeWidth: 4,
    },
    {
      id: "date-badge", kind: "badge",
      text: "19 NOVEMBER 2026",
      bg: "#8E1428", fg: "#FBF8F3", rounded: "ribbon",
      x: 0.18, y: 0.26, w: 0.64, h: 0.06,
      rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    },
    {
      ...baseText, id: "duration", kind: "text",
      text: "13-H · QUAD",
      x: 0.30, y: 0.55, w: 0.40, h: 0.06,
      size: 56, color: "#101F4C", strokeWidth: 0, font: "montserrat",
      shadowBlur: 0, shadowColor: "transparent",
    },
    {
      ...baseText, id: "old-price", kind: "text",
      text: "Rp. 36,9 Juta",
      x: 0.06, y: 0.62, w: 0.32, h: 0.05,
      size: 36, color: "#5b5b5b", strokeWidth: 0, bold: false, font: "inter",
      shadowBlur: 0, shadowColor: "transparent", align: "left",
      pricingMode: true,
    },
    {
      ...baseText, id: "new-price", kind: "text",
      text: "Rp. 34,9 Juta",
      x: 0.06, y: 0.66, w: 0.40, h: 0.07,
      size: 64, color: "#8E1428", strokeWidth: 0, bold: true, font: "inter",
      shadowBlur: 0, shadowColor: "transparent", align: "left",
    },
    {
      id: "inclusion", kind: "inclusion",
      title: "Sudah Termasuk",
      items: [
        "Free City Tour Makkah - Madinah",
        "Free City Tour Thaif",
        "3x Umroh",
        "Visa Umroh",
        "Perlengkapan Umroh Premium",
        "Handling Airport",
        "Asuransi",
        "Manasik 2x",
      ],
      columns: 2,
      x: 0.06, y: 0.74, w: 0.88, h: 0.16,
      rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    },
    {
      id: "footer", kind: "footer",
      whatsapp: "+628132543072",
      address: "Jl. Karah Indah I Blok B1A, Surabaya, Jawa Timur",
      bg: "#101F4C", fg: "#FBF8F3",
      x: 0.0, y: 0.92, w: 1.0, h: 0.08,
      rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    },
  ];
}

// ---- Helpers -----------------------------------------------------------------
function uid() { return Math.random().toString(36).slice(2, 10); }
function cssFontFamily(fontVal: string) {
  return FONTS.find((f) => f.value === fontVal)?.css ?? FONTS[0].css;
}
function textShadowCss(l: TextL) {
  if (l.shadowBlur <= 0) return undefined;
  return `${l.shadowX}px ${l.shadowY}px ${l.shadowBlur}px ${l.shadowColor}`;
}
function textStrokeCss(l: TextL): React.CSSProperties {
  if (l.strokeWidth <= 0) return {};
  return {
    WebkitTextStroke: `${l.strokeWidth}px ${l.strokeColor}`,
    paintOrder: "stroke fill",
  };
}

// ---- Main component ---------------------------------------------------------
interface Props {
  initialLayers?: Layer[];
  initialBg?: string;
}

export default function ProAdCreator({ initialLayers, initialBg }: Props) {
  const [layers, setLayers] = useState<Layer[]>(initialLayers ?? defaultLayers());
  const [bg, setBg] = useState<string | null>(initialBg ?? defaultBg);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSafe, setShowSafe] = useState(true);
  const [exporting, setExporting] = useState(false);

  // ---- AI Assistant state ----
  const [leftTab, setLeftTab] = useState<"editor" | "ai">("editor");
  const [aiPrompt, setAiPrompt] = useState(
    "Buat Paket Umroh Silver untuk November, harga 34,9 juta, durasi 13 hari, termasuk Free City Tour & 3x Umroh.",
  );
  const [aiCaption, setAiCaption] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; sx: number; sy: number; ox: number; oy: number; ow: number; oh: number; rect: DOMRect } | null>(null);

  const selected = useMemo(() => layers.find((l) => l.id === selectedId) ?? null, [layers, selectedId]);

  // ---- mutations ----
  const update = useCallback((id: string, patch: Partial<Layer>) => {
    setLayers((arr) => arr.map((l) => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  }, []);
  const remove = (id: string) => {
    setLayers((arr) => arr.filter((l) => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const reorder = (id: string, dir: -1 | 1) => {
    setLayers((arr) => {
      const i = arr.findIndex((l) => l.id === id);
      if (i < 0) return arr;
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  // ---- add layers ----
  const addText = () => {
    const nl: TextL = {
      id: uid(), kind: "text", text: "Teks baru",
      x: 0.2, y: 0.2, w: 0.6, h: 0.08, rot: 0, visible: true, locked: false, opacity: 1, z: 0,
      font: "inter", size: 56, color: "#FBF8F3", bold: true, italic: false,
      align: "center", lineHeight: 1.1, strokeWidth: 0, strokeColor: "#FFFFFF",
      shadowBlur: 8, shadowColor: "rgba(0,0,0,0.5)", shadowX: 0, shadowY: 2,
      pricingMode: false, letterSpacing: 0,
    };
    setLayers((a) => [...a, nl]); setSelectedId(nl.id);
  };
  const addImage = () => {
    const nl: ImageL = {
      id: uid(), kind: "image", src: null, mask: "none",
      x: 0.3, y: 0.3, w: 0.4, h: 0.3, rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    };
    setLayers((a) => [...a, nl]); setSelectedId(nl.id);
  };
  const addShape = () => {
    const nl: ShapeL = {
      id: uid(), kind: "shape", shape: "rect", fill: "#8E1428", fillOpacity: 0.85, radius: 16,
      x: 0.3, y: 0.4, w: 0.4, h: 0.1, rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    };
    setLayers((a) => [...a, nl]); setSelectedId(nl.id);
  };
  const addBadge = () => {
    const nl: BadgeL = {
      id: uid(), kind: "badge", text: "13-H", bg: "#C99A3F", fg: "#101F4C", rounded: "pill",
      x: 0.4, y: 0.5, w: 0.2, h: 0.06, rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    };
    setLayers((a) => [...a, nl]); setSelectedId(nl.id);
  };
  const addInclusion = () => {
    const nl: InclusionL = {
      id: uid(), kind: "inclusion", title: "Sudah Termasuk",
      items: ["Tiket Pesawat PP", "Hotel Bintang 5", "Visa & Asuransi", "Bus & Manasik"],
      columns: 1,
      x: 0.1, y: 0.55, w: 0.8, h: 0.2, rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    };
    setLayers((a) => [...a, nl]); setSelectedId(nl.id);
  };
  const addFooter = () => {
    const nl: FooterL = {
      id: uid(), kind: "footer",
      whatsapp: "+628132543072",
      address: "Office address",
      bg: "#101F4C", fg: "#FBF8F3",
      x: 0, y: 0.92, w: 1, h: 0.08, rot: 0, visible: true, locked: false, opacity: 1, z: 0,
    };
    setLayers((a) => [...a, nl]); setSelectedId(nl.id);
  };

  // ---- drag/resize handlers ----
  const onPointerDown = (e: React.PointerEvent, id: string, mode: "move" | "resize") => {
    const layer = layers.find((l) => l.id === id);
    if (!layer || layer.locked || !canvasRef.current) return;
    e.stopPropagation();
    setSelectedId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      id, mode,
      sx: e.clientX, sy: e.clientY,
      ox: layer.x, oy: layer.y, ow: layer.w, oh: layer.h, rect,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = (e.clientX - d.sx) / d.rect.width;
    const dy = (e.clientY - d.sy) / d.rect.height;
    if (d.mode === "move") {
      update(d.id, {
        x: Math.max(0, Math.min(1 - d.ow, d.ox + dx)),
        y: Math.max(0, Math.min(1 - d.oh, d.oy + dy)),
      });
    } else {
      update(d.id, {
        w: Math.max(0.04, Math.min(1 - d.ox, d.ow + dx)),
        h: Math.max(0.03, Math.min(1 - d.oy, d.oh + dy)),
      });
    }
  };
  const onPointerUp = () => { dragRef.current = null; };

  // ---- file inputs ----
  const handleBgUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setBg(url);
  };
  const handleImageUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    update(id, { src: url } as Partial<ImageL>);
  };

  // ---- export ----
  const exportPng = useCallback(async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: AD_W,
        height: AD_H,
        backgroundColor: "#000",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `paket-umroh-${Date.now()}.png`;
      link.click();
      toast.success("Poster berhasil diunduh!");
    } catch (err) {
      console.error(err);
      toast.error("Export gagal: " + (err instanceof Error ? err.message : "error"));
    } finally {
      setExporting(false);
    }
  }, []);

  // ---- keyboard delete ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const tgt = e.target as HTMLElement;
        if (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA") return;
        e.preventDefault();
        remove(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // ============================== RENDER ===============================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_320px] gap-4 h-[calc(100vh-180px)]">
      {/* ============== LEFT: Tools ============== */}
      <aside className="rounded-2xl bg-card border border-border p-3 overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Tambah Elemen</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={addText}><Type className="w-3 h-3 mr-1" /> Teks</Button>
          <Button size="sm" variant="outline" onClick={addImage}><ImageIcon className="w-3 h-3 mr-1" /> Gambar</Button>
          <Button size="sm" variant="outline" onClick={addShape}><SquareIcon className="w-3 h-3 mr-1" /> Bentuk</Button>
          <Button size="sm" variant="outline" onClick={addBadge}><Tag className="w-3 h-3 mr-1" /> Badge</Button>
          <Button size="sm" variant="outline" onClick={addInclusion} className="col-span-2"><ListChecks className="w-3 h-3 mr-1" /> Inclusion Box</Button>
          <Button size="sm" variant="outline" onClick={addFooter} className="col-span-2"><Phone className="w-3 h-3 mr-1" /> Footer Brand</Button>
        </div>

        <div className="border-t border-border pt-3 mb-3">
          <Label className="text-xs">Background</Label>
          <input
            type="file" accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleBgUpload(e.target.files[0])}
            className="mt-1 w-full text-xs"
          />
          {bg && (
            <Button size="sm" variant="ghost" className="mt-1 w-full text-destructive" onClick={() => setBg(null)}>
              <Trash2 className="w-3 h-3 mr-1" /> Hapus background
            </Button>
          )}
        </div>

        <div className="border-t border-border pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Safe Area (Meta Ads)</Label>
            <Switch checked={showSafe} onCheckedChange={setShowSafe} />
          </div>
          <Button
            size="sm" className="w-full bg-primary text-primary-foreground"
            onClick={exportPng} disabled={exporting}
          >
            <Download className="w-3 h-3 mr-1" />
            {exporting ? "Mengekspor..." : "Unduh Poster (PNG)"}
          </Button>
        </div>
      </aside>

      {/* ============== CENTER: Canvas ============== */}
      <div className="flex flex-col items-center justify-start overflow-auto bg-muted/40 rounded-2xl p-4">
        <div className="text-xs text-muted-foreground mb-2 font-mono">{AD_W} × {AD_H} px · Meta Ads 4:5</div>
        {/* The visible canvas (scaled to fit), but hidden export node renders at true size */}
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={() => setSelectedId(null)}
          className="relative bg-black shadow-2xl rounded-md overflow-hidden"
          style={{
            width: "min(100%, 540px)",
            aspectRatio: `${AD_W} / ${AD_H}`,
          }}
        >
          <CanvasContent
            bg={bg}
            layers={layers}
            selectedId={selectedId}
            showSafe={showSafe}
            onPointerDownLayer={onPointerDown}
            onUploadImage={handleImageUpload}
            onUpdate={update}
            preview
          />
        </div>
      </div>

      {/* ============== RIGHT: Layers + Inspector ============== */}
      <aside className="rounded-2xl bg-card border border-border p-3 overflow-y-auto">
        <Tabs defaultValue="layers" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="layers"><Layers className="w-3 h-3 mr-1" />Layer</TabsTrigger>
            <TabsTrigger value="props">Properti</TabsTrigger>
          </TabsList>
          <TabsContent value="layers" className="mt-3">
            <ScrollArea className="h-[55vh] pr-2">
              <div className="space-y-1">
                {[...layers].reverse().map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      "flex items-center gap-1 p-2 rounded border text-xs cursor-pointer transition-colors",
                      selectedId === l.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50",
                    )}
                    onClick={() => setSelectedId(l.id)}
                  >
                    <span className="w-4">
                      {l.kind === "text" ? <Type className="w-3 h-3" /> :
                       l.kind === "image" ? <ImageIcon className="w-3 h-3" /> :
                       l.kind === "shape" ? <SquareIcon className="w-3 h-3" /> :
                       l.kind === "badge" ? <Tag className="w-3 h-3" /> :
                       l.kind === "inclusion" ? <ListChecks className="w-3 h-3" /> :
                       <Phone className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 truncate">
                      {l.kind === "text" ? l.text : l.kind === "badge" ? l.text : l.kind === "inclusion" ? l.title : l.kind}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); update(l.id, { visible: !l.visible }); }} className="p-1 hover:bg-muted rounded">
                      {l.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); update(l.id, { locked: !l.locked }); }} className="p-1 hover:bg-muted rounded">
                      {l.locked ? <Lock className="w-3 h-3 text-destructive" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); reorder(l.id, 1); }} className="p-1 hover:bg-muted rounded"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); reorder(l.id, -1); }} className="p-1 hover:bg-muted rounded"><ArrowDown className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); remove(l.id); }} className="p-1 hover:bg-destructive/20 rounded"><Trash2 className="w-3 h-3 text-destructive" /></button>
                  </div>
                ))}
                {layers.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">Belum ada layer.</p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="props" className="mt-3">
            {selected ? (
              <Inspector layer={selected} update={(p) => update(selected.id, p)} />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">Pilih sebuah layer.</p>
            )}
          </TabsContent>
        </Tabs>
      </aside>

      {/* HIDDEN: Full-size export node — html-to-image renders this at 1080x1350 */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none" aria-hidden>
        <div
          ref={exportRef}
          className="relative bg-black overflow-hidden"
          style={{ width: AD_W, height: AD_H }}
        >
          <CanvasContent
            bg={bg}
            layers={layers}
            selectedId={null}
            showSafe={false}
            onPointerDownLayer={() => {}}
            onUploadImage={() => {}}
            onUpdate={() => {}}
            preview={false}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CanvasContent — renders bg + layers. Used both for live preview (scaled) and
// for the hidden full-size export node. `preview=true` enables interactivity.
// =============================================================================
interface CanvasContentProps {
  bg: string | null;
  layers: Layer[];
  selectedId: string | null;
  showSafe: boolean;
  onPointerDownLayer: (e: React.PointerEvent, id: string, mode: "move" | "resize") => void;
  onUploadImage: (id: string, file: File) => void;
  onUpdate: (id: string, patch: Partial<Layer>) => void;
  preview: boolean;
}
function CanvasContent({
  bg, layers, selectedId, showSafe, onPointerDownLayer, onUploadImage, onUpdate, preview,
}: CanvasContentProps) {
  return (
    <>
      {bg && (
        <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover select-none" draggable={false} />
      )}
      {showSafe && (
        <div
          className="absolute pointer-events-none border-2 border-dashed border-amber-400/80"
          style={{ inset: `${SAFE_PCT}%` }}
        >
          <span className="absolute -top-5 left-0 text-[10px] uppercase tracking-widest text-amber-400/80 font-mono">Safe Area</span>
        </div>
      )}
      {layers.map((l) => (
        <LayerView
          key={l.id}
          layer={l}
          selected={l.id === selectedId}
          preview={preview}
          onPointerDown={(e, mode) => onPointerDownLayer(e, l.id, mode)}
          onUploadImage={(f) => onUploadImage(l.id, f)}
          onUpdate={(p) => onUpdate(l.id, p)}
        />
      ))}
    </>
  );
}

// =============================================================================
// LayerView — single layer renderer
// =============================================================================
interface LayerViewProps {
  layer: Layer;
  selected: boolean;
  preview: boolean;
  onPointerDown: (e: React.PointerEvent, mode: "move" | "resize") => void;
  onUploadImage: (f: File) => void;
  onUpdate: (p: Partial<Layer>) => void;
}
function LayerView({ layer: l, selected, preview, onPointerDown, onUploadImage }: LayerViewProps) {
  if (!l.visible) return null;

  const wrap: React.CSSProperties = {
    position: "absolute",
    left: `${l.x * 100}%`,
    top: `${l.y * 100}%`,
    width: `${l.w * 100}%`,
    height: `${l.h * 100}%`,
    transform: `rotate(${l.rot}deg)`,
    opacity: l.opacity,
    cursor: preview ? (l.locked ? "not-allowed" : "move") : "default",
    outline: preview && selected ? "2px solid hsl(var(--primary))" : "none",
    outlineOffset: 1,
  };

  const onDown = preview ? (e: React.PointerEvent) => onPointerDown(e, "move") : undefined;

  if (l.kind === "text") {
    const sizePct = (l.size / AD_H) * 100;
    return (
      <div style={wrap} onPointerDown={onDown}>
        <div
          className="w-full h-full flex"
          style={{
            fontFamily: cssFontFamily(l.font),
            fontSize: `${sizePct}cqh`,
            color: l.color,
            fontWeight: l.bold ? 800 : 400,
            fontStyle: l.italic ? "italic" : "normal",
            textAlign: l.align,
            lineHeight: l.lineHeight,
            letterSpacing: l.letterSpacing,
            justifyContent: l.align === "center" ? "center" : l.align === "right" ? "flex-end" : "flex-start",
            alignItems: "center",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            textShadow: textShadowCss(l),
            textDecoration: l.pricingMode ? "line-through" : "none",
            textDecorationColor: l.pricingMode ? "#dc2626" : undefined,
            textDecorationThickness: l.pricingMode ? "0.08em" : undefined,
            ...textStrokeCss(l),
          }}
        >
          {l.text}
        </div>
        {preview && selected && <ResizeHandle onPointerDown={(e) => onPointerDown(e, "resize")} />}
      </div>
    );
  }

  if (l.kind === "image") {
    return (
      <div style={wrap} onPointerDown={onDown}>
        {l.src ? (
          <img
            src={l.src} alt=""
            className="w-full h-full object-cover select-none"
            style={{ borderRadius: l.mask === "circle" ? "50%" : 8 }}
            draggable={false}
          />
        ) : (
          preview ? (
            <label className="w-full h-full bg-muted/60 border-2 border-dashed border-muted-foreground/40 flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/80">
              <ImageIcon className="w-5 h-5 mb-1" />
              <span>Klik untuk upload</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
            </label>
          ) : null
        )}
        {preview && selected && <ResizeHandle onPointerDown={(e) => onPointerDown(e, "resize")} />}
      </div>
    );
  }

  if (l.kind === "shape") {
    return (
      <div style={wrap} onPointerDown={onDown}>
        <div
          className="w-full h-full"
          style={{
            backgroundColor: l.fill,
            opacity: l.fillOpacity,
            borderRadius: l.shape === "circle" ? "50%" : l.radius,
          }}
        />
        {preview && selected && <ResizeHandle onPointerDown={(e) => onPointerDown(e, "resize")} />}
      </div>
    );
  }

  if (l.kind === "badge") {
    const radius = l.rounded === "pill" ? 9999 : l.rounded === "ribbon" ? 6 : 12;
    return (
      <div style={wrap} onPointerDown={onDown}>
        <div
          className="w-full h-full flex items-center justify-center font-bold uppercase tracking-wider"
          style={{
            background: l.bg, color: l.fg, borderRadius: radius,
            fontSize: "55cqh",
            fontFamily: cssFontFamily("montserrat"),
            boxShadow: l.rounded === "ribbon" ? "0 4px 12px rgba(0,0,0,0.25)" : undefined,
            clipPath: l.rounded === "ribbon"
              ? "polygon(0 0, 100% 0, 96% 50%, 100% 100%, 0 100%, 4% 50%)"
              : undefined,
            paddingLeft: l.rounded === "ribbon" ? "5%" : "8%",
            paddingRight: l.rounded === "ribbon" ? "5%" : "8%",
          }}
        >
          {l.text}
        </div>
        {preview && selected && <ResizeHandle onPointerDown={(e) => onPointerDown(e, "resize")} />}
      </div>
    );
  }

  if (l.kind === "inclusion") {
    return (
      <div style={wrap} onPointerDown={onDown}>
        <div
          className="w-full h-full bg-white/85 backdrop-blur-md rounded-2xl shadow-lg flex flex-col p-[3%]"
          style={{ fontFamily: cssFontFamily("inter") }}
        >
          <div
            className="self-center -mt-[7%] px-[4%] py-[1%] bg-[#8E1428] text-white rounded-md font-bold mb-[2%]"
            style={{ fontSize: "11cqh" }}
          >
            {l.title}
          </div>
          <ul
            className={cn("flex-1 list-disc pl-[5%] text-[#101F4C] font-medium", l.columns === 2 && "columns-2 gap-[6%]")}
            style={{ fontSize: "8cqh", lineHeight: 1.4 }}
          >
            {l.items.map((it, i) => <li key={i} className="break-inside-avoid">{it}</li>)}
          </ul>
        </div>
        {preview && selected && <ResizeHandle onPointerDown={(e) => onPointerDown(e, "resize")} />}
      </div>
    );
  }

  if (l.kind === "footer") {
    return (
      <div style={wrap} onPointerDown={onDown}>
        <div
          className="w-full h-full flex items-center px-[3%] gap-[2%]"
          style={{ background: l.bg, color: l.fg, fontFamily: cssFontFamily("montserrat") }}
        >
          <div className="flex items-center gap-2 font-bold" style={{ fontSize: "32cqh" }}>
            <MessageCircle className="shrink-0" style={{ width: "1em", height: "1em" }} />
            <div className="leading-tight">
              <div className="text-[0.4em] uppercase tracking-widest opacity-80">For Booking</div>
              <div>{l.whatsapp}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto" style={{ fontSize: "20cqh" }}>
            <MapPin className="shrink-0" style={{ width: "1em", height: "1em" }} />
            <span className="leading-tight">{l.address}</span>
          </div>
        </div>
        {preview && selected && <ResizeHandle onPointerDown={(e) => onPointerDown(e, "resize")} />}
      </div>
    );
  }

  return null;
}

function ResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <motion.div
      onPointerDown={onPointerDown}
      whileHover={{ scale: 1.2 }}
      className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary border-2 border-background rounded-sm cursor-se-resize z-20"
    />
  );
}

// =============================================================================
// Inspector — properties panel for selected layer
// =============================================================================
function Inspector({ layer: l, update }: { layer: Layer; update: (p: Partial<Layer>) => void }) {
  if (l.kind === "text") {
    return (
      <div className="space-y-3 text-xs">
        <div>
          <Label className="text-xs">Teks</Label>
          <Textarea rows={2} value={l.text} onChange={(e) => update({ text: e.target.value })} className="text-xs" />
        </div>
        <div>
          <Label className="text-xs">Font</Label>
          <select className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={l.font} onChange={(e) => update({ font: e.target.value })}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs">Ukuran ({l.size}px)</Label>
          <Slider value={[l.size]} min={12} max={240} step={1} onValueChange={(v) => update({ size: v[0] })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Warna</Label>
            <Input type="color" value={l.color} onChange={(e) => update({ color: e.target.value })} className="h-8 p-1" />
          </div>
          <div>
            <Label className="text-xs">Letter Sp.</Label>
            <Input type="number" step={0.5} value={l.letterSpacing} onChange={(e) => update({ letterSpacing: parseFloat(e.target.value) })} className="h-8 text-xs" />
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={l.bold ? "default" : "outline"} onClick={() => update({ bold: !l.bold })}><Bold className="w-3 h-3" /></Button>
          <Button size="sm" variant={l.italic ? "default" : "outline"} onClick={() => update({ italic: !l.italic })}><Italic className="w-3 h-3" /></Button>
          <Button size="sm" variant={l.align === "left" ? "default" : "outline"} onClick={() => update({ align: "left" })}><AlignLeft className="w-3 h-3" /></Button>
          <Button size="sm" variant={l.align === "center" ? "default" : "outline"} onClick={() => update({ align: "center" })}><AlignCenter className="w-3 h-3" /></Button>
          <Button size="sm" variant={l.align === "right" ? "default" : "outline"} onClick={() => update({ align: "right" })}><AlignRight className="w-3 h-3" /></Button>
        </div>

        <div className="border-t border-border pt-2">
          <Label className="text-xs font-semibold">Stroke</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <Label className="text-[10px]">Lebar ({l.strokeWidth}px)</Label>
              <Slider value={[l.strokeWidth]} min={0} max={12} step={0.5} onValueChange={(v) => update({ strokeWidth: v[0] })} />
            </div>
            <div>
              <Label className="text-[10px]">Warna</Label>
              <Input type="color" value={l.strokeColor} onChange={(e) => update({ strokeColor: e.target.value })} className="h-8 p-1" />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-2">
          <Label className="text-xs font-semibold">Shadow</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div>
              <Label className="text-[10px]">Blur ({l.shadowBlur}px)</Label>
              <Slider value={[l.shadowBlur]} min={0} max={40} step={1} onValueChange={(v) => update({ shadowBlur: v[0] })} />
            </div>
            <div>
              <Label className="text-[10px]">Warna</Label>
              <Input type="color"
                value={l.shadowColor.startsWith("#") ? l.shadowColor : "#000000"}
                onChange={(e) => update({ shadowColor: e.target.value })}
                className="h-8 p-1" />
            </div>
            <div>
              <Label className="text-[10px]">Offset X ({l.shadowX}px)</Label>
              <Slider value={[l.shadowX]} min={-20} max={20} step={1} onValueChange={(v) => update({ shadowX: v[0] })} />
            </div>
            <div>
              <Label className="text-[10px]">Offset Y ({l.shadowY}px)</Label>
              <Slider value={[l.shadowY]} min={-20} max={20} step={1} onValueChange={(v) => update({ shadowY: v[0] })} />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-2 flex items-center justify-between">
          <div>
            <Label className="text-xs font-semibold">Pricing Mode</Label>
            <p className="text-[10px] text-muted-foreground">Garis coret merah untuk harga lama</p>
          </div>
          <Switch checked={l.pricingMode} onCheckedChange={(v) => update({ pricingMode: v })} />
        </div>
      </div>
    );
  }

  if (l.kind === "image") {
    return (
      <div className="space-y-3 text-xs">
        <div>
          <Label className="text-xs">Upload Gambar</Label>
          <input type="file" accept="image/*" className="mt-1 w-full text-xs"
            onChange={(e) => {
              const f = e.target.files?.[0]; if (!f) return;
              update({ src: URL.createObjectURL(f) } as Partial<ImageL>);
            }} />
        </div>
        <div>
          <Label className="text-xs">Mask</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={l.mask === "none" ? "default" : "outline"} onClick={() => update({ mask: "none" } as Partial<ImageL>)}>
              <SqOutline className="w-3 h-3 mr-1" /> Kotak
            </Button>
            <Button size="sm" variant={l.mask === "circle" ? "default" : "outline"} onClick={() => update({ mask: "circle" } as Partial<ImageL>)}>
              <CircleIcon className="w-3 h-3 mr-1" /> Lingkaran
            </Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">Opacity ({Math.round(l.opacity * 100)}%)</Label>
          <Slider value={[l.opacity]} min={0} max={1} step={0.05} onValueChange={(v) => update({ opacity: v[0] })} />
        </div>
      </div>
    );
  }

  if (l.kind === "shape") {
    return (
      <div className="space-y-3 text-xs">
        <div>
          <Label className="text-xs">Bentuk</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={l.shape === "rect" ? "default" : "outline"} onClick={() => update({ shape: "rect" } as Partial<ShapeL>)}>Kotak</Button>
            <Button size="sm" variant={l.shape === "circle" ? "default" : "outline"} onClick={() => update({ shape: "circle" } as Partial<ShapeL>)}>Lingkaran</Button>
          </div>
        </div>
        <div>
          <Label className="text-xs">Warna</Label>
          <Input type="color" value={l.fill} onChange={(e) => update({ fill: e.target.value })} className="h-8 p-1" />
        </div>
        <div>
          <Label className="text-xs">Opacity ({Math.round(l.fillOpacity * 100)}%)</Label>
          <Slider value={[l.fillOpacity]} min={0} max={1} step={0.05} onValueChange={(v) => update({ fillOpacity: v[0] })} />
        </div>
        {l.shape === "rect" && (
          <div>
            <Label className="text-xs">Radius ({l.radius}px)</Label>
            <Slider value={[l.radius]} min={0} max={80} step={1} onValueChange={(v) => update({ radius: v[0] })} />
          </div>
        )}
      </div>
    );
  }

  if (l.kind === "badge") {
    return (
      <div className="space-y-3 text-xs">
        <div><Label className="text-xs">Teks</Label><Input value={l.text} onChange={(e) => update({ text: e.target.value })} className="h-8 text-xs" /></div>
        <div>
          <Label className="text-xs">Bentuk</Label>
          <div className="flex gap-1 mt-1">
            {(["pill", "ribbon", "tag"] as const).map((r) => (
              <Button key={r} size="sm" variant={l.rounded === r ? "default" : "outline"} onClick={() => update({ rounded: r } as Partial<BadgeL>)}>{r}</Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">BG</Label><Input type="color" value={l.bg} onChange={(e) => update({ bg: e.target.value })} className="h-8 p-1" /></div>
          <div><Label className="text-xs">FG</Label><Input type="color" value={l.fg} onChange={(e) => update({ fg: e.target.value })} className="h-8 p-1" /></div>
        </div>
      </div>
    );
  }

  if (l.kind === "inclusion") {
    return (
      <div className="space-y-3 text-xs">
        <div><Label className="text-xs">Judul</Label><Input value={l.title} onChange={(e) => update({ title: e.target.value })} className="h-8 text-xs" /></div>
        <div>
          <Label className="text-xs">Items (1 baris = 1 item)</Label>
          <Textarea rows={6} value={l.items.join("\n")} onChange={(e) => update({ items: e.target.value.split("\n") } as Partial<InclusionL>)} className="text-xs" />
        </div>
        <div>
          <Label className="text-xs">Kolom</Label>
          <div className="flex gap-2 mt-1">
            <Button size="sm" variant={l.columns === 1 ? "default" : "outline"} onClick={() => update({ columns: 1 } as Partial<InclusionL>)}>1</Button>
            <Button size="sm" variant={l.columns === 2 ? "default" : "outline"} onClick={() => update({ columns: 2 } as Partial<InclusionL>)}>2</Button>
          </div>
        </div>
      </div>
    );
  }

  if (l.kind === "footer") {
    return (
      <div className="space-y-3 text-xs">
        <div><Label className="text-xs">WhatsApp</Label><Input value={l.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} className="h-8 text-xs" /></div>
        <div><Label className="text-xs">Alamat</Label><Textarea rows={2} value={l.address} onChange={(e) => update({ address: e.target.value })} className="text-xs" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">BG</Label><Input type="color" value={l.bg} onChange={(e) => update({ bg: e.target.value })} className="h-8 p-1" /></div>
          <div><Label className="text-xs">FG</Label><Input type="color" value={l.fg} onChange={(e) => update({ fg: e.target.value })} className="h-8 p-1" /></div>
        </div>
      </div>
    );
  }

  return null;
}
