import { useState, useRef, useCallback, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Type, Image as ImageIcon, Square, Star,
  Trash2, Eye, EyeOff, Lock, Unlock, ArrowUp, ArrowDown,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Plus, Sparkles, Palette as PaletteIcon, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { toast } from "sonner";

export type LayerKind = "text" | "image" | "shape" | "icon" | "logo";

export interface BaseLayer {
  id: string;
  kind: LayerKind;
  x: number; // 0-1
  y: number;
  width: number;
  height: number;
  rotation: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
}

export interface TextLayerEl extends BaseLayer {
  kind: "text";
  text: string;
  fontFamily: "display" | "body" | "alt";
  fontSize: number; // % of canvas height
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  lineHeight: number;
  bgColor?: string;
  bgOpacity?: number;
}
export interface ImageLayerEl extends BaseLayer {
  kind: "image";
  imageUrl: string | null;
}
export interface ShapeLayerEl extends BaseLayer {
  kind: "shape";
  shape: "rect" | "circle";
  color: string;
  bgOpacity: number;
}
export interface IconLayerEl extends BaseLayer {
  kind: "icon";
  iconName: string;
  color: string;
}
export interface LogoLayerEl extends BaseLayer {
  kind: "logo";
}
export type Layer = TextLayerEl | ImageLayerEl | ShapeLayerEl | IconLayerEl | LogoLayerEl;

export const FORMAT_DIM: Record<string, { w: number; h: number; label: string }> = {
  a4_portrait: { w: 794, h: 1123, label: "A4 Portrait" },
  instagram_post: { w: 1080, h: 1080, label: "Instagram Post" },
  instagram_story: { w: 1080, h: 1920, label: "Story 9:16" },
  banner_landscape: { w: 1920, h: 1080, label: "Banner 16:9" },
};

export const SAFE_AREA_PCT = 5;

export interface GlobalStyle {
  filterShadow: number;   // 0-1
  filterBlur: number;     // 0-20px
  filterGrain: number;    // 0-1
  brandPalette: boolean;
  brandFonts: boolean;
}

export const DEFAULT_GLOBAL_STYLE: GlobalStyle = {
  filterShadow: 0, filterBlur: 0, filterGrain: 0,
  brandPalette: false, brandFonts: false,
};

const BRAND_PALETTE = ["#8E1428", "#101F4C", "#C99A3F", "#FBF8F3"];

interface Props {
  format: string;
  backgroundUrl?: string;
  layers: Layer[];
  onChange: (layers: Layer[]) => void;
  logoUrl?: string;
  globalStyle: GlobalStyle;
  onGlobalStyleChange: (gs: GlobalStyle) => void;
  onResizeFormat?: (newFormat: string) => void;
}

export default function LayeredCanvasEditor({
  format, backgroundUrl, layers, onChange,
  logoUrl, globalStyle, onGlobalStyleChange, onResizeFormat,
}: Props) {
  const dim = FORMAT_DIM[format] ?? FORMAT_DIM.instagram_post;
  const aspect = dim.w / dim.h;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSafe, setShowSafe] = useState(false);
  const dragRef = useRef<{ id: string; mode: "move" | "resize"; startX: number; startY: number; ox: number; oy: number; ow: number; oh: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => layers.find(l => l.id === selectedId) ?? null, [layers, selectedId]);

  const update = useCallback((id: string, patch: Partial<Layer>) => {
    onChange(layers.map(l => (l.id === id ? ({ ...l, ...patch } as Layer) : l)));
  }, [layers, onChange]);

  const addLayer = (kind: LayerKind) => {
    const id = `el-${Date.now()}`;
    const base: BaseLayer = {
      id, kind, x: 0.1, y: 0.4, width: 0.8, height: 0.1,
      rotation: 0, locked: false, visible: true, opacity: 1,
    };
    let next: Layer;
    if (kind === "text") {
      next = { ...base, kind: "text", text: "Teks baru", fontFamily: "display", fontSize: 6, color: "#101F4C", bold: false, italic: false, align: "center", lineHeight: 1.2, bgColor: undefined, bgOpacity: 0 };
    } else if (kind === "image") {
      next = { ...base, kind: "image", imageUrl: null };
    } else if (kind === "shape") {
      next = { ...base, kind: "shape", shape: "rect", color: "#8E1428", bgOpacity: 0.8, height: 0.15 };
    } else if (kind === "icon") {
      next = { ...base, kind: "icon", iconName: "Star", color: "#C99A3F", width: 0.1, height: 0.1 };
    } else {
      next = { ...base, kind: "logo", width: 0.2, height: 0.1 };
    }
    onChange([...layers, next]);
    setSelectedId(id);
  };

  const removeLayer = (id: string) => {
    onChange(layers.filter(l => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorderLayer = (id: string, dir: -1 | 1) => {
    const idx = layers.findIndex(l => l.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= layers.length) return;
    const arr = [...layers];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    onChange(arr);
  };

  // ==== Pointer drag ====
  const onPointerDown = (e: React.PointerEvent, id: string, mode: "move" | "resize") => {
    const layer = layers.find(l => l.id === id);
    if (!layer || layer.locked) return;
    e.stopPropagation();
    setSelectedId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id, mode,
      startX: e.clientX, startY: e.clientY,
      ox: layer.x, oy: layer.y, ow: layer.width, oh: layer.height,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = (e.clientX - d.startX) / rect.width;
    const dy = (e.clientY - d.startY) / rect.height;
    if (d.mode === "move") {
      update(d.id, { x: Math.max(0, Math.min(1 - d.ow, d.ox + dx)), y: Math.max(0, Math.min(1 - d.oh, d.oy + dy)) });
    } else {
      update(d.id, { width: Math.max(0.05, Math.min(1 - d.ox, d.ow + dx)), height: Math.max(0.03, Math.min(1 - d.oy, d.oh + dy)) });
    }
  };
  const onPointerUp = () => { dragRef.current = null; };

  // ==== Brandify actions ====
  const brandifyColors = () => {
    onChange(layers.map((l, i) => {
      const brandColor = BRAND_PALETTE[i % BRAND_PALETTE.length];
      if (l.kind === "text") return { ...l, color: l.bgColor ? "#FBF8F3" : brandColor };
      if (l.kind === "shape" || l.kind === "icon") return { ...l, color: brandColor };
      return l;
    }));
    toast.success("Warna di-brandify ke palet KHT");
  };
  const overrideFonts = () => {
    onChange(layers.map(l => l.kind === "text" ? { ...l, fontFamily: l.fontFamily === "body" ? "body" : "display" } as Layer : l));
    toast.success("Font diset ke Playfair + Inter");
  };

  const fontClass = (f: "display" | "body" | "alt") =>
    f === "display" ? "font-serif" : f === "alt" ? "font-mono" : "font-sans";

  // ==== Render layer ====
  const renderLayer = (l: Layer) => {
    if (!l.visible) return null;
    const isSel = l.id === selectedId;
    const styleBase: React.CSSProperties = {
      position: "absolute",
      left: `${l.x * 100}%`,
      top: `${l.y * 100}%`,
      width: `${l.width * 100}%`,
      height: `${l.height * 100}%`,
      transform: `rotate(${l.rotation}deg)`,
      opacity: l.opacity,
      cursor: l.locked ? "not-allowed" : "move",
      outline: isSel ? "2px solid hsl(var(--primary))" : "none",
      outlineOffset: 2,
    };

    if (l.kind === "text") {
      const fontPx = `${l.fontSize}cqh`;
      return (
        <div key={l.id} style={styleBase} onPointerDown={(e) => onPointerDown(e, l.id, "move")} className={cn("group", isSel && "z-10")}>
          <div
            className={cn("w-full h-full flex items-center px-2", fontClass(l.fontFamily))}
            style={{
              color: l.color,
              fontSize: fontPx,
              fontWeight: l.bold ? 700 : 400,
              fontStyle: l.italic ? "italic" : "normal",
              textAlign: l.align,
              lineHeight: l.lineHeight,
              backgroundColor: l.bgColor ? hexWithOpacity(l.bgColor, l.bgOpacity ?? 1) : "transparent",
              justifyContent: l.align === "center" ? "center" : l.align === "right" ? "flex-end" : "flex-start",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              borderRadius: l.bgColor ? 6 : 0,
            }}
          >
            {l.text}
          </div>
          {isSel && <ResizeHandle onPointerDown={(e) => onPointerDown(e, l.id, "resize")} />}
        </div>
      );
    }

    if (l.kind === "image") {
      return (
        <div key={l.id} style={styleBase} onPointerDown={(e) => onPointerDown(e, l.id, "move")}>
          {l.imageUrl ? (
            <img src={l.imageUrl} alt="" className="w-full h-full object-cover rounded" draggable={false} />
          ) : (
            <div className="w-full h-full bg-muted/50 border border-dashed border-muted-foreground/40 flex items-center justify-center text-xs text-muted-foreground">
              <ImageIcon className="w-4 h-4 mr-1" /> Image
            </div>
          )}
          {isSel && <ResizeHandle onPointerDown={(e) => onPointerDown(e, l.id, "resize")} />}
        </div>
      );
    }

    if (l.kind === "shape") {
      return (
        <div key={l.id} style={styleBase} onPointerDown={(e) => onPointerDown(e, l.id, "move")}>
          <div
            className="w-full h-full"
            style={{
              backgroundColor: hexWithOpacity(l.color, l.bgOpacity ?? 1),
              borderRadius: l.shape === "circle" ? "50%" : 8,
            }}
          />
          {isSel && <ResizeHandle onPointerDown={(e) => onPointerDown(e, l.id, "resize")} />}
        </div>
      );
    }

    if (l.kind === "icon") {
      const Icon = ((Icons as unknown) as Record<string, React.ComponentType<{ className?: string; color?: string; strokeWidth?: number }>>)[l.iconName] || Icons.Star;
      return (
        <div key={l.id} style={styleBase} onPointerDown={(e) => onPointerDown(e, l.id, "move")}>
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-full h-full" color={l.color} strokeWidth={1.5} />
          </div>
          {isSel && <ResizeHandle onPointerDown={(e) => onPointerDown(e, l.id, "resize")} />}
        </div>
      );
    }

    if (l.kind === "logo") {
      return (
        <div key={l.id} style={styleBase} onPointerDown={(e) => onPointerDown(e, l.id, "move")}>
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-full h-full object-contain" draggable={false} />
          ) : (
            <div className="w-full h-full bg-muted/40 border border-dashed flex items-center justify-center text-xs text-muted-foreground">Logo</div>
          )}
          {isSel && <ResizeHandle onPointerDown={(e) => onPointerDown(e, l.id, "resize")} />}
        </div>
      );
    }
    return null;
  };

  // CSS filter from globalStyle
  const bgFilter = `${globalStyle.filterBlur > 0 ? `blur(${globalStyle.filterBlur}px) ` : ""}${globalStyle.filterShadow > 0 ? `brightness(${1 - globalStyle.filterShadow * 0.4})` : ""}`.trim();

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4">
      {/* ==== Canvas ==== */}
      <Card className="p-4 bg-muted/30 overflow-hidden">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <div className="text-sm text-muted-foreground">{dim.label} • {dim.w}×{dim.h}</div>
          <div className="flex items-center gap-2 flex-wrap">
            {onResizeFormat && (
              <select
                value={format}
                onChange={(e) => onResizeFormat(e.target.value)}
                className="text-xs bg-background border rounded px-2 py-1"
              >
                {Object.entries(FORMAT_DIM).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowSafe(s => !s)}>
              {showSafe ? "Hide Safe" : "Safe Area"}
            </Button>
          </div>
        </div>
        <div className="w-full flex items-center justify-center" style={{ minHeight: 400 }}>
          <div
            ref={canvasRef}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={() => setSelectedId(null)}
            className="relative bg-background shadow-xl overflow-hidden"
            style={{
              aspectRatio: aspect,
              width: "100%",
              maxHeight: "70vh",
              maxWidth: aspect > 1 ? "100%" : `${aspect * 70}vh`,
              containerType: "size",
            }}
          >
            {backgroundUrl && (
              <img
                src={backgroundUrl}
                alt="bg"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: bgFilter || undefined }}
                draggable={false}
              />
            )}
            {globalStyle.filterGrain > 0 && (
              <div
                className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{
                  opacity: globalStyle.filterGrain,
                  backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>\")",
                }}
              />
            )}
            {showSafe && (
              <div
                className="absolute pointer-events-none border-2 border-dashed border-primary/50"
                style={{ inset: `${SAFE_AREA_PCT}%` }}
              />
            )}
            {layers.map(renderLayer)}
          </div>
        </div>
      </Card>

      {/* ==== Sidebar ==== */}
      <Card className="p-3">
        <Tabs defaultValue="layers">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="layers">Layers</TabsTrigger>
            <TabsTrigger value="props">Edit</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
          </TabsList>

          {/* === LAYERS TAB === */}
          <TabsContent value="layers" className="space-y-2 mt-3">
            <div className="grid grid-cols-5 gap-1">
              <Button size="sm" variant="outline" onClick={() => addLayer("text")} title="Text"><Type className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => addLayer("image")} title="Image"><ImageIcon className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => addLayer("shape")} title="Shape"><Square className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => addLayer("icon")} title="Icon"><Star className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" onClick={() => addLayer("logo")} title="Logo"><Plus className="w-3 h-3" /></Button>
            </div>
            <ScrollArea className="h-[55vh] pr-2">
              <div className="space-y-1">
                {layers.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6">Belum ada layer. Tambah dari icon di atas.</div>
                )}
                {[...layers].reverse().map((l) => (
                  <div
                    key={l.id}
                    className={cn(
                      "flex items-center gap-1 p-2 rounded border text-xs cursor-pointer",
                      selectedId === l.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50",
                    )}
                    onClick={() => setSelectedId(l.id)}
                  >
                    <span className="w-4 text-center">
                      {l.kind === "text" ? <Type className="w-3 h-3" /> :
                       l.kind === "image" ? <ImageIcon className="w-3 h-3" /> :
                       l.kind === "shape" ? <Square className="w-3 h-3" /> :
                       l.kind === "icon" ? <Star className="w-3 h-3" /> :
                       <Plus className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 truncate">
                      {l.kind === "text" ? (l.text || "Text") : l.kind}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); update(l.id, { visible: !l.visible }); }} className="p-1 hover:bg-muted rounded">
                      {l.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); update(l.id, { locked: !l.locked }); }} className="p-1 hover:bg-muted rounded">
                      {l.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); reorderLayer(l.id, 1); }} className="p-1 hover:bg-muted rounded"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); reorderLayer(l.id, -1); }} className="p-1 hover:bg-muted rounded"><ArrowDown className="w-3 h-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* === PROPS TAB === */}
          <TabsContent value="props" className="mt-3">
            <ScrollArea className="h-[60vh] pr-2">
              {!selected ? (
                <div className="text-xs text-muted-foreground text-center py-6">Pilih layer untuk edit properti.</div>
              ) : (
                <div className="space-y-3">
                  {selected.kind === "text" && <TextProps layer={selected} update={(p) => update(selected.id, p)} />}
                  {selected.kind === "image" && <ImageProps layer={selected} update={(p) => update(selected.id, p)} />}
                  {selected.kind === "shape" && <ShapeProps layer={selected} update={(p) => update(selected.id, p)} />}
                  {selected.kind === "icon" && <IconProps layer={selected} update={(p) => update(selected.id, p)} />}
                  <CommonProps layer={selected} update={(p) => update(selected.id, p)} />
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* === GLOBAL TAB === */}
          <TabsContent value="global" className="mt-3 space-y-3">
            <div className="space-y-2">
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={brandifyColors}>
                <PaletteIcon className="w-3 h-3 mr-2" /> Brandify Colors
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start" onClick={overrideFonts}>
                <Wand2 className="w-3 h-3 mr-2" /> Override Fonts ke Brand
              </Button>
            </div>
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label className="text-xs">Shadow ({Math.round(globalStyle.filterShadow * 100)}%)</Label>
                <Slider value={[globalStyle.filterShadow * 100]} max={100} step={5}
                  onValueChange={([v]) => onGlobalStyleChange({ ...globalStyle, filterShadow: v / 100 })} />
              </div>
              <div>
                <Label className="text-xs">Blur ({globalStyle.filterBlur}px)</Label>
                <Slider value={[globalStyle.filterBlur]} max={20} step={1}
                  onValueChange={([v]) => onGlobalStyleChange({ ...globalStyle, filterBlur: v })} />
              </div>
              <div>
                <Label className="text-xs">Grain ({Math.round(globalStyle.filterGrain * 100)}%)</Label>
                <Slider value={[globalStyle.filterGrain * 100]} max={100} step={5}
                  onValueChange={([v]) => onGlobalStyleChange({ ...globalStyle, filterGrain: v / 100 })} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function ResizeHandle({ onPointerDown }: { onPointerDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      onPointerDown={onPointerDown}
      className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-background cursor-nwse-resize z-20"
    />
  );
}

function CommonProps({ layer, update }: { layer: Layer; update: (p: Partial<Layer>) => void }) {
  return (
    <div className="space-y-2 pt-3 border-t">
      <div>
        <Label className="text-xs">Opacity ({Math.round(layer.opacity * 100)}%)</Label>
        <Slider value={[layer.opacity * 100]} max={100} step={5} onValueChange={([v]) => update({ opacity: v / 100 })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">X ({Math.round(layer.x * 100)}%)</Label>
          <Slider value={[layer.x * 100]} max={100} step={1} onValueChange={([v]) => update({ x: v / 100 })} />
        </div>
        <div>
          <Label className="text-xs">Y ({Math.round(layer.y * 100)}%)</Label>
          <Slider value={[layer.y * 100]} max={100} step={1} onValueChange={([v]) => update({ y: v / 100 })} />
        </div>
        <div>
          <Label className="text-xs">W ({Math.round(layer.width * 100)}%)</Label>
          <Slider value={[layer.width * 100]} min={5} max={100} step={1} onValueChange={([v]) => update({ width: v / 100 })} />
        </div>
        <div>
          <Label className="text-xs">H ({Math.round(layer.height * 100)}%)</Label>
          <Slider value={[layer.height * 100]} min={3} max={100} step={1} onValueChange={([v]) => update({ height: v / 100 })} />
        </div>
      </div>
    </div>
  );
}

function TextProps({ layer, update }: { layer: TextLayerEl; update: (p: Partial<TextLayerEl>) => void }) {
  return (
    <>
      <div>
        <Label className="text-xs">Teks</Label>
        <Textarea value={layer.text} onChange={(e) => update({ text: e.target.value })} rows={3} className="text-xs" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        <Button size="sm" variant={layer.fontFamily === "display" ? "default" : "outline"} onClick={() => update({ fontFamily: "display" })} className="text-xs">Display</Button>
        <Button size="sm" variant={layer.fontFamily === "body" ? "default" : "outline"} onClick={() => update({ fontFamily: "body" })} className="text-xs">Body</Button>
        <Button size="sm" variant={layer.fontFamily === "alt" ? "default" : "outline"} onClick={() => update({ fontFamily: "alt" })} className="text-xs">Alt</Button>
      </div>
      <div>
        <Label className="text-xs">Font Size ({layer.fontSize}%)</Label>
        <Slider value={[layer.fontSize]} min={1} max={20} step={0.5} onValueChange={([v]) => update({ fontSize: v })} />
      </div>
      <div>
        <Label className="text-xs">Line Height ({layer.lineHeight})</Label>
        <Slider value={[layer.lineHeight * 10]} min={8} max={25} step={1} onValueChange={([v]) => update({ lineHeight: v / 10 })} />
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant={layer.bold ? "default" : "outline"} onClick={() => update({ bold: !layer.bold })}><Bold className="w-3 h-3" /></Button>
        <Button size="sm" variant={layer.italic ? "default" : "outline"} onClick={() => update({ italic: !layer.italic })}><Italic className="w-3 h-3" /></Button>
        <Button size="sm" variant={layer.align === "left" ? "default" : "outline"} onClick={() => update({ align: "left" })}><AlignLeft className="w-3 h-3" /></Button>
        <Button size="sm" variant={layer.align === "center" ? "default" : "outline"} onClick={() => update({ align: "center" })}><AlignCenter className="w-3 h-3" /></Button>
        <Button size="sm" variant={layer.align === "right" ? "default" : "outline"} onClick={() => update({ align: "right" })}><AlignRight className="w-3 h-3" /></Button>
      </div>
      <div>
        <Label className="text-xs">Warna Teks</Label>
        <Input type="color" value={layer.color} onChange={(e) => update({ color: e.target.value })} className="h-8" />
      </div>
      <div>
        <Label className="text-xs">Background</Label>
        <div className="flex gap-2 items-center">
          <Input type="color" value={layer.bgColor || "#000000"} onChange={(e) => update({ bgColor: e.target.value })} className="h-8 w-16" />
          <Slider value={[(layer.bgOpacity ?? 0) * 100]} max={100} step={5} onValueChange={([v]) => update({ bgOpacity: v / 100 })} />
        </div>
      </div>
    </>
  );
}

function ImageProps({ layer, update }: { layer: ImageLayerEl; update: (p: Partial<ImageLayerEl>) => void }) {
  return (
    <div>
      <Label className="text-xs">Image URL</Label>
      <Input value={layer.imageUrl ?? ""} onChange={(e) => update({ imageUrl: e.target.value || null })} placeholder="https://..." className="text-xs" />
      <p className="text-xs text-muted-foreground mt-1">Tip: upload via Brand Kit dulu lalu paste URL.</p>
    </div>
  );
}

function ShapeProps({ layer, update }: { layer: ShapeLayerEl; update: (p: Partial<ShapeLayerEl>) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1">
        <Button size="sm" variant={layer.shape === "rect" ? "default" : "outline"} onClick={() => update({ shape: "rect" })}>Rect</Button>
        <Button size="sm" variant={layer.shape === "circle" ? "default" : "outline"} onClick={() => update({ shape: "circle" })}>Circle</Button>
      </div>
      <div>
        <Label className="text-xs">Warna</Label>
        <Input type="color" value={layer.color} onChange={(e) => update({ color: e.target.value })} className="h-8" />
      </div>
      <div>
        <Label className="text-xs">Opacity Bg ({Math.round(layer.bgOpacity * 100)}%)</Label>
        <Slider value={[layer.bgOpacity * 100]} max={100} step={5} onValueChange={([v]) => update({ bgOpacity: v / 100 })} />
      </div>
    </>
  );
}

const ICON_CHOICES = ["Star", "Heart", "Sparkles", "MapPin", "Calendar", "Plane", "Users", "Award", "Crown", "Moon", "Sun"];
function IconProps({ layer, update }: { layer: IconLayerEl; update: (p: Partial<IconLayerEl>) => void }) {
  return (
    <>
      <div>
        <Label className="text-xs">Icon</Label>
        <select value={layer.iconName} onChange={(e) => update({ iconName: e.target.value })}
          className="w-full text-xs bg-background border rounded px-2 py-1 mt-1">
          {ICON_CHOICES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <Label className="text-xs">Warna</Label>
        <Input type="color" value={layer.color} onChange={(e) => update({ color: e.target.value })} className="h-8" />
      </div>
    </>
  );
}

function hexWithOpacity(hex: string, opacity: number): string {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
