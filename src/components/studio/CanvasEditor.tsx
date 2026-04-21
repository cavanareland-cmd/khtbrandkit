import { useState, useRef, useEffect } from "react";
import { Move, Trash2, Plus, Type, Bold, Italic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type TextLayer = {
  id: string;
  text: string;
  x: number; // %
  y: number; // %
  fontSize: number; // px at 1080 base
  fontFamily: "display" | "body" | "alt";
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  width: number; // % of canvas
  lineHeight?: number; // multiplier, default 1.15
  bgColor?: string;
  bgOpacity?: number;
};

// Safe area margin in % (industry-standard ~5% inner padding)
export const SAFE_AREA_PERCENT = 5;

const FORMAT_DIMENSIONS: Record<string, { w: number; h: number; label: string }> = {
  a4_portrait: { w: 794, h: 1123, label: "A4 Portrait" },
  instagram_post: { w: 1080, h: 1080, label: "Instagram Post" },
  instagram_story: { w: 1080, h: 1920, label: "Instagram Story" },
  banner_landscape: { w: 1920, h: 1080, label: "Landscape Banner" },
};

const COLOR_PRESETS = [
  { name: "Ivory", value: "#FBF8F3" },
  { name: "White", value: "#FFFFFF" },
  { name: "Maroon", value: "#8E1428" },
  { name: "Maroon Deep", value: "#5C0A18" },
  { name: "Navy", value: "#101F4C" },
  { name: "Gold", value: "#C99A3F" },
  { name: "Black", value: "#111A2C" },
];

interface Props {
  format: string;
  backgroundUrl?: string;
  layers: TextLayer[];
  onChange: (layers: TextLayer[]) => void;
  logoUrl?: string;
  showLogo: boolean;
  onShowLogoChange: (show: boolean) => void;
}

export default function CanvasEditor({ format, backgroundUrl, layers, onChange, logoUrl, showLogo, onShowLogoChange }: Props) {
  const dims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.instagram_post;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(layers[0]?.id ?? null);
  const [dragState, setDragState] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const selected = layers.find((l) => l.id === selectedId);

  useEffect(() => {
    if (selectedId && !layers.find((l) => l.id === selectedId)) {
      setSelectedId(layers[0]?.id ?? null);
    }
  }, [layers, selectedId]);

  const updateLayer = (id: string, patch: Partial<TextLayer>) => {
    onChange(layers.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const addLayer = () => {
    const id = crypto.randomUUID();
    const newLayer: TextLayer = {
      id,
      text: "Teks baru",
      x: 50,
      y: 50,
      fontSize: 48,
      fontFamily: "display",
      color: "#FBF8F3",
      bold: false,
      italic: false,
      align: "center",
      width: 80,
    };
    onChange([...layers, newLayer]);
    setSelectedId(id);
  };

  const removeLayer = (id: string) => {
    onChange(layers.filter((l) => l.id !== id));
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const layerX = (layer.x / 100) * rect.width;
    const layerY = (layer.y / 100) * rect.height;
    setDragState({ id, offsetX: e.clientX - rect.left - layerX, offsetY: e.clientY - rect.top - layerY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left - dragState.offsetX) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragState.offsetY) / rect.height) * 100;
    updateLayer(dragState.id, {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handlePointerUp = () => setDragState(null);

  // Scale factor: canvas displayed width vs base width
  const aspectRatio = dims.w / dims.h;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6 h-full">
      {/* Canvas Preview */}
      <div className="flex items-center justify-center bg-muted/30 rounded-2xl p-6 min-h-[500px] overflow-auto">
        <div
          className="relative shadow-elegant overflow-hidden bg-secondary"
          style={{
            aspectRatio: `${dims.w} / ${dims.h}`,
            width: "100%",
            maxWidth: dims.w > dims.h ? "100%" : `${(dims.w / dims.h) * 600}px`,
            maxHeight: "75vh",
          }}
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={() => setSelectedId(null)}
          data-canvas-id="promo-canvas"
        >
          {backgroundUrl ? (
            <img
              src={backgroundUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-hero flex items-center justify-center text-primary-foreground/50 text-sm font-alt uppercase tracking-widest">
              Background akan muncul di sini
            </div>
          )}

          {/* Logo */}
          {showLogo && logoUrl && (
            <img
              src={logoUrl}
              alt="logo"
              crossOrigin="anonymous"
              className="absolute pointer-events-none"
              style={{
                bottom: "4%",
                right: "4%",
                width: "12%",
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
              }}
            />
          )}

          {/* Text layers */}
          {layers.map((layer) => {
            const isSelected = selectedId === layer.id;
            return (
              <div
                key={layer.id}
                onPointerDown={(e) => handlePointerDown(e, layer.id)}
                className={`absolute cursor-move select-none transition-shadow ${isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-secondary/30" : ""}`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${layer.width}%`,
                  fontFamily: layer.fontFamily === "display" ? '"Playfair Display", serif' : layer.fontFamily === "body" ? "Inter, sans-serif" : "Montserrat, sans-serif",
                  fontSize: `clamp(8px, ${(layer.fontSize / dims.w) * 100}cqw, ${layer.fontSize}px)`,
                  color: layer.color,
                  fontWeight: layer.bold ? 700 : 400,
                  fontStyle: layer.italic ? "italic" : "normal",
                  textAlign: layer.align,
                  lineHeight: 1.15,
                  padding: layer.bgColor ? "0.4em 0.8em" : 0,
                  background: layer.bgColor ? `${layer.bgColor}${Math.round((layer.bgOpacity ?? 1) * 255).toString(16).padStart(2, "0")}` : "transparent",
                  textShadow: layer.bgColor ? "none" : "0 2px 8px rgba(0,0,0,0.4)",
                  containerType: "inline-size",
                }}
              >
                {layer.text || "Teks kosong"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Panel */}
      <div className="space-y-4 overflow-y-auto max-h-[80vh] pr-1">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-lg font-semibold">Layer</h4>
          <Button size="sm" variant="outline" onClick={addLayer}>
            <Plus className="h-3 w-3 mr-1" /> Teks
          </Button>
        </div>

        <div className="space-y-1.5 border border-border rounded-xl p-2 bg-card">
          {layers.length === 0 && <p className="text-xs text-muted-foreground p-2">Belum ada layer.</p>}
          {layers.map((l, i) => (
            <button
              key={l.id}
              onClick={() => setSelectedId(l.id)}
              className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-smooth ${
                selectedId === l.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <Type className="h-3 w-3 shrink-0" />
              <span className="flex-1 truncate">{l.text || `Layer ${i + 1}`}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeLayer(l.id); }}
                className="opacity-60 hover:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between p-3 border border-border rounded-xl bg-card">
          <Label htmlFor="show-logo" className="text-xs cursor-pointer">Tampilkan Logo KHT</Label>
          <input
            id="show-logo"
            type="checkbox"
            checked={showLogo}
            onChange={(e) => onShowLogoChange(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </div>

        {selected && (
          <div className="space-y-4 border border-border rounded-xl p-4 bg-card">
            <p className="font-alt text-[10px] uppercase tracking-widest text-accent">Properti Teks</p>

            <div className="space-y-1.5">
              <Label className="text-xs">Teks</Label>
              <textarea
                value={selected.text}
                onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                rows={3}
                className="w-full text-sm p-2 border border-input rounded-md bg-background resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Font</Label>
              <Select value={selected.fontFamily} onValueChange={(v: "display" | "body" | "alt") => updateLayer(selected.id, { fontFamily: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="display">Playfair Display</SelectItem>
                  <SelectItem value="body">Inter</SelectItem>
                  <SelectItem value="alt">Montserrat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Ukuran: {selected.fontSize}px</Label>
              <Slider
                value={[selected.fontSize]}
                min={12} max={200} step={1}
                onValueChange={(v) => updateLayer(selected.id, { fontSize: v[0] })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Lebar: {selected.width}%</Label>
              <Slider
                value={[selected.width]}
                min={20} max={100} step={1}
                onValueChange={(v) => updateLayer(selected.id, { width: v[0] })}
              />
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant={selected.bold ? "default" : "outline"} onClick={() => updateLayer(selected.id, { bold: !selected.bold })} className="flex-1 h-8">
                <Bold className="h-3 w-3" />
              </Button>
              <Button size="sm" variant={selected.italic ? "default" : "outline"} onClick={() => updateLayer(selected.id, { italic: !selected.italic })} className="flex-1 h-8">
                <Italic className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <Button key={a} size="sm" variant={selected.align === a ? "default" : "outline"} onClick={() => updateLayer(selected.id, { align: a })} className="flex-1 h-8 text-xs capitalize">
                  {a}
                </Button>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Warna Teks</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => updateLayer(selected.id, { color: c.value })}
                    title={c.name}
                    className={`h-7 rounded-md border-2 transition-smooth ${selected.color === c.value ? "border-accent scale-110" : "border-border"}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <Input type="color" value={selected.color} onChange={(e) => updateLayer(selected.id, { color: e.target.value })} className="h-8 cursor-pointer" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                Background
                <button
                  onClick={() => updateLayer(selected.id, { bgColor: selected.bgColor ? undefined : "#101F4C", bgOpacity: 0.85 })}
                  className="text-[10px] text-primary hover:underline"
                >
                  {selected.bgColor ? "Hapus" : "Tambah"}
                </button>
              </Label>
              {selected.bgColor && (
                <>
                  <div className="grid grid-cols-7 gap-1.5">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => updateLayer(selected.id, { bgColor: c.value })}
                        className={`h-7 rounded-md border-2 ${selected.bgColor === c.value ? "border-accent scale-110" : "border-border"}`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                  <Label className="text-xs">Opacity: {Math.round((selected.bgOpacity ?? 1) * 100)}%</Label>
                  <Slider
                    value={[(selected.bgOpacity ?? 1) * 100]}
                    min={0} max={100} step={5}
                    onValueChange={(v) => updateLayer(selected.id, { bgOpacity: v[0] / 100 })}
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <Label className="text-xs">X: {Math.round(selected.x)}%</Label>
                <Slider value={[selected.x]} min={0} max={100} step={1} onValueChange={(v) => updateLayer(selected.id, { x: v[0] })} className="mt-2" />
              </div>
              <div>
                <Label className="text-xs">Y: {Math.round(selected.y)}%</Label>
                <Slider value={[selected.y]} min={0} max={100} step={1} onValueChange={(v) => updateLayer(selected.id, { y: v[0] })} className="mt-2" />
              </div>
            </div>
          </div>
        )}

        {!selected && layers.length > 0 && (
          <p className="text-xs text-muted-foreground p-3 text-center">
            <Move className="h-3 w-3 inline mr-1" />
            Klik layer untuk mengedit
          </p>
        )}
      </div>
    </div>
  );
}

export { FORMAT_DIMENSIONS };
