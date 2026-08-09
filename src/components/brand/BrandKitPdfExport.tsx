import { useState } from "react";
import { Download, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import fallbackLogo from "@/assets/karin-logo.png";
import lockupLogo from "@/assets/karin-logo-lockup.png";

type Row = { section: string; key: string | null; data: Record<string, unknown>; sort_order: number };

const MAROON: [number, number, number] = [142, 20, 40];
const NAVY: [number, number, number] = [16, 31, 76];
const GOLD: [number, number, number] = [201, 154, 63];
const INK: [number, number, number] = [17, 26, 44];
const MUTED: [number, number, number] = [110, 110, 120];

type LoadedImage = { dataUrl: string; w: number; h: number };

const imageCache = new Map<string, LoadedImage | null>();

async function loadImage(src: string): Promise<LoadedImage | null> {
  if (!src) return null;
  if (imageCache.has(src)) return imageCache.get(src) ?? null;

  const result = await (async (): Promise<LoadedImage | null> => {
    try {
      const res = await fetch(src, { cache: "force-cache" });
      if (!res.ok) return null;
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) return null;

      const dataUrl = await new Promise<string | null>((resolve) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = () => resolve(null);
        r.readAsDataURL(blob);
      });
      if (!dataUrl) return null;

      const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      });
      if (!dims) return null;
      return { dataUrl, ...dims };
    } catch {
      return null;
    }
  })();

  imageCache.set(src, result);
  return result;
}

/** Remote lockup URLs can be unavailable (dev/offline); fall back to the bundled file. */
async function loadWithFallback(src: string | undefined, fallback: string) {
  return (src ? await loadImage(src) : null) ?? (await loadImage(fallback));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Fit an image inside a box while preserving aspect ratio (returns centred rect). */
function fitBox(img: LoadedImage, x: number, y: number, boxW: number, boxH: number) {
  const scale = Math.min(boxW / img.w, boxH / img.h);
  const w = img.w * scale;
  const h = img.h * scale;
  return { x: x + (boxW - w) / 2, y: y + (boxH - h) / 2, w, h };
}

const BrandKitPdfExport = ({ className = "" }: { className?: string }) => {
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    const toastId = toast.loading("Menyiapkan Brand Kit PDF...");
    try {
      const { data, error } = await supabase
        .from("brand_kit")
        .select("section,key,data,sort_order")
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true });
      if (error) throw error;

      const rows = ((data ?? []) as unknown as Row[]).map((r) => ({
        ...r,
        data: (r.data ?? {}) as Record<string, unknown>,
      }));
      const by = (s: string) => rows.filter((r) => r.section === s);
      const identity: Record<string, string> = {};
      const tagPills: string[] = [];
      by("identity").forEach((r) => {
        const v = String(r.data.value ?? "");
        if (r.key === "tag_pill") tagPills.push(v);
        else if (r.key && !identity[r.key]) identity[r.key] = v;
      });

      const brandName = identity.brand_name_primary || "Karin Hidayah Tour";
      const colors = by("color").map((r) => r.data as Record<string, string>);
      const fonts = by("typography").map((r) => r.data as Record<string, string>);
      const logoRows = by("asset_logo");
      const logos = logoRows.map((r) => r.data as Record<string, string | boolean>);
      const icons = by("asset_icon").map((r) => r.data as Record<string, string>);
      const personality = by("voice_personality").map((r) => r.data as Record<string, string>);
      const voiceDo = by("voice_do").map((r) => String(r.data.text ?? ""));
      const voiceDont = by("voice_dont").map((r) => String(r.data.text ?? ""));

      const lockupRow = logoRows.find((r) => r.key === "logo_lockup");
      const lockupUrl = lockupRow ? String((lockupRow.data as Record<string, unknown>).image_url ?? "") : "";
      const coverImage = await loadWithFallback(lockupUrl || undefined, lockupLogo);
      const markImage = await loadImage(fallbackLogo);

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      doc.setProperties({ title: `${brandName} — Brand Kit`, subject: "Brand Identity Guidelines", author: brandName });

      const W = 210;
      const H = 297;
      const M = 18;
      let y = M;

      const footer = (page: number) => {
        if (page === 1) return; // cover has no footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(`${brandName} · Brand Kit`, M, H - 12);
        doc.text(String(page), W - M, H - 12, { align: "right" });
      };

      let page = 1;
      const newPage = () => {
        footer(page);
        doc.addPage();
        page += 1;
        y = M + 4;
      };
      const ensure = (needed: number) => {
        if (y + needed > H - 22) newPage();
      };
      const sectionTitle = (num: string, title: string) => {
        ensure(30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...GOLD);
        doc.text(num.toUpperCase(), M, y);
        y += 6;
        doc.setFontSize(18);
        doc.setTextColor(...NAVY);
        doc.text(title, M, y);
        y += 4;
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.6);
        doc.line(M, y, M + 22, y);
        y += 10;
      };
      const paragraph = (text: string, size = 10) => {
        if (!text) return;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(size);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(text, W - M * 2);
        lines.forEach((line: string) => {
          ensure(6);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(size);
          doc.setTextColor(...INK);
          doc.text(line, M, y);
          y += size * 0.5 + 1.4;
        });
        y += 2;
      };

      // ── Cover ────────────────────────────────────────────────
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, H, "F");
      doc.setFillColor(...MAROON);
      doc.rect(0, H - 62, W, 62, "F");
      doc.setFillColor(...GOLD);
      doc.rect(0, H - 64, W, 2, "F");

      if (coverImage) {
        // White plate keeps dark wordmarks legible on the navy cover.
        const plateW = W - M * 2;
        const plateH = 58;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(M, 42, plateW, plateH, 4, 4, "F");
        const box = fitBox(coverImage, M + 10, 48, plateW - 20, plateH - 12);
        try {
          doc.addImage(coverImage.dataUrl, "PNG", box.x, box.y, box.w, box.h, undefined, "FAST");
        } catch {
          /* ignore unsupported image */
        }
      }

      doc.setTextColor(...GOLD);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text((identity.badge_label || "Brand Identity Guidelines").toUpperCase(), M, 122);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(30);
      const nameLines = doc.splitTextToSize(brandName, W - M * 2) as string[];
      doc.text(nameLines, M, 136);
      let coverY = 136 + nameLines.length * 11;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(225, 227, 235);
      doc.text(identity.category_label || "Travel Umrah & Haji", M, coverY);
      coverY += 10;
      if (tagPills.length) {
        doc.setFontSize(9.5);
        doc.setTextColor(...GOLD);
        doc.text(tagPills.join("   ·   "), M, coverY);
      }

      if (identity.tagline) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text(doc.splitTextToSize(identity.tagline, W - M * 2), M, H - 40);
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(255, 226, 190);
      doc.text(
        `Dibuat otomatis · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        M,
        H - 14,
      );

      // ── Identitas ────────────────────────────────────────────
      newPage();
      sectionTitle("01 — Identitas", "Identitas Brand");
      if (markImage) {
        const box = fitBox(markImage, W - M - 26, y - 16, 26, 26);
        try {
          doc.addImage(markImage.dataUrl, "PNG", box.x, box.y, box.w, box.h, undefined, "FAST");
        } catch {
          /* ignore */
        }
      }
      const idRows: [string, string][] = [
        ["Nama Brand", identity.brand_name_primary || "-"],
        ["Singkatan", identity.brand_name_secondary || "-"],
        ["Kategori", identity.category_label || "-"],
        ["Tagline", identity.tagline || "-"],
        ["Kata Kunci", tagPills.join(" · ") || "-"],
      ];
      idRows.forEach(([label, value]) => {
        ensure(16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...MAROON);
        doc.text(label.toUpperCase(), M, y);
        y += 5.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(value, W - M * 2);
        lines.forEach((l: string) => {
          ensure(6);
          doc.text(l, M, y);
          y += 5.5;
        });
        y += 3;
        doc.setDrawColor(233, 231, 226);
        doc.setLineWidth(0.2);
        doc.line(M, y, W - M, y);
        y += 6;
      });

      // ── Warna ────────────────────────────────────────────────
      newPage();
      sectionTitle("02 — Warna", "Sistem Warna");
      const swW = (W - M * 2 - 10) / 2;
      colors.forEach((c, i) => {
        const col = i % 2;
        if (col === 0) ensure(36);
        const x = M + col * (swW + 10);
        const top = y;
        try {
          doc.setFillColor(...hexToRgb(c.hex || "#000000"));
        } catch {
          doc.setFillColor(0, 0, 0);
        }
        doc.roundedRect(x, top, swW, 18, 2, 2, "F");
        doc.setDrawColor(228, 226, 220);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, top, swW, 18, 2, 2, "S");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...INK);
        doc.text(c.name || "-", x, top + 24);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(`${c.hex ?? ""}  ·  RGB ${c.rgb ?? ""}  ·  ${c.role ?? ""}`, x, top + 29);
        if (col === 1 || i === colors.length - 1) y = top + 36;
      });

      // ── Tipografi (own page: keeps type specimens together) ──
      newPage();
      sectionTitle("03 — Tipografi", "Tipografi");
      fonts.forEach((f) => {
        ensure(26);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...NAVY);
        doc.text(f.name || "-", M, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...GOLD);
        doc.text((f.role || "").toUpperCase(), W - M, y, { align: "right" });
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        const descLines = doc.splitTextToSize(
          `${f.desc || ""} (Bobot: ${f.weight || "-"})`,
          W - M * 2,
        ) as string[];
        doc.text(descLines, M, y);
        y += descLines.length * 5 + 5;
        doc.setDrawColor(230, 228, 222);
        doc.setLineWidth(0.2);
        doc.line(M, y, W - M, y);
        y += 8;
      });

      // ── Aset ─────────────────────────────────────────────────
      newPage();
      sectionTitle("04 — Aset", "Aset Logo & Ikon");

      const rawAssets = [...logos, ...icons].filter(
        (a) => typeof a.image_url === "string" && a.image_url,
      ) as Record<string, string>[];
      // Drop duplicates (same file uploaded twice) so the grid stays clean.
      const seen = new Set<string>();
      const imageAssets = rawAssets.filter((a) => {
        const k = a.image_url;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (imageAssets.length) {
        const cell = (W - M * 2 - 12) / 3;
        let col = 0;
        let rowTop = y;
        for (let i = 0; i < imageAssets.length; i++) {
          const asset = imageAssets[i];
          if (col === 0) {
            ensure(cell + 16);
            rowTop = y;
          }
          const x = M + col * (cell + 6);
          doc.setFillColor(252, 251, 249);
          doc.setDrawColor(225, 222, 216);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, rowTop, cell, cell, 2, 2, "FD");

          const isLockup = asset.title === lockupRow?.data?.["title"];
          const img = isLockup
            ? await loadWithFallback(asset.image_url, lockupLogo)
            : await loadImage(asset.image_url);
          let drawn = false;
          if (img) {
            const box = fitBox(img, x + 4, rowTop + 4, cell - 8, cell - 8);
            try {
              doc.addImage(img.dataUrl, "PNG", box.x, box.y, box.w, box.h, undefined, "FAST");
              drawn = true;
            } catch {
              drawn = false;
            }
          }
          if (!drawn) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...MUTED);
            doc.text("Pratinjau tidak tersedia", x + cell / 2, rowTop + cell / 2, { align: "center" });
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(...INK);
          const caption = doc.splitTextToSize(asset.title || asset.name || "-", cell) as string[];
          doc.text(caption.slice(0, 2), x, rowTop + cell + 5);

          col = (col + 1) % 3;
          if (col === 0 || i === imageAssets.length - 1) y = rowTop + cell + 16;
        }
      }

      const textIcons = icons.filter((i) => !i.image_url);
      if (textIcons.length) {
        ensure(24);
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...MAROON);
        doc.text("IKON SISTEM", M, y);
        y += 7;
        textIcons.forEach((ic) => {
          ensure(7);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(...INK);
          doc.text(`${ic.name} (${ic.icon}) — ${ic.desc ?? ""}`, M, y);
          y += 6;
        });
      }

      // ── Brand Voice ──────────────────────────────────────────
      newPage();
      sectionTitle("05 — Brand Voice", "Panduan Suara Brand");
      personality.forEach((p) => {
        ensure(22);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...NAVY);
        doc.text(p.title || "-", M, y);
        y += 5.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(p.desc || "", W - M * 2);
        lines.forEach((l: string) => {
          ensure(6);
          doc.text(l, M, y);
          y += 5;
        });
        y += 5;
      });

      const voiceBlock = (title: string, items: string[], color: [number, number, number]) => {
        if (!items.length) return;
        ensure(24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...color);
        doc.text(title, M, y);
        y += 6;
        items.forEach((t) => {
          const lines = doc.splitTextToSize(`•  ${t}`, W - M * 2 - 4);
          lines.forEach((l: string) => {
            ensure(6);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9.5);
            doc.setTextColor(...INK);
            doc.text(l, M + 2, y);
            y += 5;
          });
        });
        y += 6;
      };
      voiceBlock("YANG DIANJURKAN (DO)", voiceDo, [22, 120, 70]);
      voiceBlock("YANG DIHINDARI (DON'T)", voiceDont, MAROON);

      footer(page);
      doc.save(`${brandName.replace(/\s+/g, "-")}-Brand-Kit.pdf`);
      toast.success("Brand Kit PDF berhasil diunduh", { id: toastId });
    } catch (e) {
      console.error("Brand Kit PDF error:", e);
      toast.error("Gagal membuat PDF: " + (e instanceof Error ? e.message : "Unknown"), { id: toastId });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={busy} className={`gap-2 ${className}`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
      {busy ? "Menyiapkan PDF..." : "Unduh Brand Kit (PDF)"}
      {!busy && <Download className="h-4 w-4 opacity-70" />}
    </Button>
  );
};

export default BrandKitPdfExport;
