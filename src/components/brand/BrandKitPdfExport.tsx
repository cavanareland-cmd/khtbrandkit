import { useState } from "react";
import { Download, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import fallbackLogo from "@/assets/karin-logo.png";

type Row = { section: string; key: string | null; data: Record<string, unknown>; sort_order: number };

const MAROON: [number, number, number] = [142, 20, 40];
const NAVY: [number, number, number] = [16, 31, 76];
const GOLD: [number, number, number] = [201, 154, 63];
const INK: [number, number, number] = [17, 26, 44];
const MUTED: [number, number, number] = [110, 110, 120];

async function toDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;

    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null as unknown as string);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
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

      const rows = ((data ?? []) as unknown as Row[]).map((r) => ({ ...r, data: (r.data ?? {}) as Record<string, unknown> }));
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
      const logos = by("asset_logo").map((r) => r.data as Record<string, string | boolean>);
      const icons = by("asset_icon").map((r) => r.data as Record<string, string>);
      const personality = by("voice_personality").map((r) => r.data as Record<string, string>);
      const voiceDo = by("voice_do").map((r) => String(r.data.text ?? ""));
      const voiceDont = by("voice_dont").map((r) => String(r.data.text ?? ""));

      const lockup = logos.find((l) => typeof l.image_url === "string" && l.image_url) as
        | Record<string, string>
        | undefined;
      const coverLogo =
        (lockup?.image_url ? await toDataUrl(lockup.image_url as string) : null) ??
        (await toDataUrl(fallbackLogo));


      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const W = 210;
      const H = 297;
      const M = 18;
      let y = M;

      const footer = (page: number) => {
        if (page === 1) return; // cover has no footer
        doc.setFont("helvetica", "normal");

        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(`${brandName} · Brand Kit`, M, H - 10);
        doc.text(String(page), W - M, H - 10, { align: "right" });
      };

      let page = 1;
      const newPage = () => {
        footer(page);
        doc.addPage();
        page += 1;
        y = M;
      };
      const ensure = (needed: number) => {
        if (y + needed > H - 20) newPage();
      };
      const sectionTitle = (num: string, title: string) => {
        ensure(24);
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
        y += 9;
      };
      const paragraph = (text: string, size = 10) => {
        if (!text) return;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(size);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(text, W - M * 2);
        lines.forEach((line: string) => {
          ensure(6);
          doc.text(line, M, y);
          y += size * 0.5 + 1.4;
        });
        y += 2;
      };

      // ── Cover ────────────────────────────────────────────────
      doc.setFillColor(...NAVY);
      doc.rect(0, 0, W, H, "F");
      doc.setFillColor(...MAROON);
      doc.rect(0, H - 90, W, 90, "F");
      if (coverLogo) {
        try {
          doc.addImage(coverLogo, "PNG", M, 45, 60, 60, undefined, "FAST");
        } catch {
          /* ignore unsupported image */
        }
      }
      doc.setTextColor(...GOLD);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text((identity.badge_label || "Brand Identity Guidelines").toUpperCase(), M, 125);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(30);
      doc.text(doc.splitTextToSize(brandName, W - M * 2), M, 140);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(230, 230, 235);
      doc.text(identity.category_label || "Travel Umrah & Haji", M, 155);
      if (identity.tagline) {
        doc.setFontSize(11);
        doc.text(doc.splitTextToSize(identity.tagline, W - M * 2), M, H - 70);
      }
      doc.setFontSize(9);
      doc.setTextColor(255, 235, 200);
      doc.text(
        `Dibuat otomatis · ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        M,
        H - 24,
      );

      // ── Identitas ────────────────────────────────────────────
      newPage();
      sectionTitle("01 — Identitas", "Identitas Brand");
      const idRows: [string, string][] = [
        ["Nama Brand", identity.brand_name_primary || "-"],
        ["Singkatan", identity.brand_name_secondary || "-"],
        ["Kategori", identity.category_label || "-"],
        ["Tagline", identity.tagline || "-"],
        ["Kata Kunci", tagPills.join(" · ") || "-"],
      ];
      idRows.forEach(([label, value]) => {
        ensure(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...MAROON);
        doc.text(label.toUpperCase(), M, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(value, W - M * 2);
        lines.forEach((l: string) => {
          ensure(6);
          doc.text(l, M, y);
          y += 5.5;
        });
        y += 4;
      });

      // ── Warna ────────────────────────────────────────────────
      newPage();
      sectionTitle("02 — Warna", "Sistem Warna");
      const swW = (W - M * 2 - 10) / 2;
      colors.forEach((c, i) => {
        const col = i % 2;
        if (col === 0) ensure(30);
        const x = M + col * (swW + 10);
        const top = y;
        try {
          doc.setFillColor(...hexToRgb(c.hex || "#000000"));
        } catch {
          doc.setFillColor(0, 0, 0);
        }
        doc.roundedRect(x, top, swW, 18, 2, 2, "F");
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

      // ── Tipografi ────────────────────────────────────────────
      ensure(40);
      y += 4;
      sectionTitle("03 — Tipografi", "Tipografi");
      fonts.forEach((f) => {
        ensure(22);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...NAVY);
        doc.text(f.name || "-", M, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...GOLD);
        doc.text((f.role || "").toUpperCase(), W - M, y, { align: "right" });
        y += 5;
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        doc.text(doc.splitTextToSize(`${f.desc || ""} (Bobot: ${f.weight || "-"})`, W - M * 2), M, y);
        y += 12;
        doc.setDrawColor(230, 228, 222);
        doc.setLineWidth(0.2);
        doc.line(M, y - 4, W - M, y - 4);
      });

      // ── Aset ─────────────────────────────────────────────────
      newPage();
      sectionTitle("04 — Aset", "Aset Logo & Ikon");
      const imageAssets = [...logos, ...icons].filter(
        (a) => typeof a.image_url === "string" && a.image_url,
      ) as Record<string, string>[];

      if (imageAssets.length) {
        const cell = (W - M * 2 - 12) / 3;
        let col = 0;
        for (const asset of imageAssets) {
          if (col === 0) ensure(cell + 16);
          const x = M + col * (cell + 6);
          const top = y;
          doc.setDrawColor(225, 222, 216);
          doc.setLineWidth(0.3);
          doc.roundedRect(x, top, cell, cell, 2, 2, "S");
          const img = await toDataUrl(asset.image_url);
          let drawn = false;
          if (img) {
            try {
              doc.addImage(img, "PNG", x + 4, top + 4, cell - 8, cell - 8, undefined, "FAST");
              drawn = true;
            } catch {
              drawn = false;
            }
          }
          if (!drawn) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(...MUTED);
            doc.text("Pratinjau tidak tersedia", x + cell / 2, top + cell / 2, { align: "center" });
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(...INK);
          doc.text(doc.splitTextToSize(asset.title || asset.name || "-", cell), x, top + cell + 5);
          col = (col + 1) % 3;
          if (col === 0) y = top + cell + 14;
          else if (asset === imageAssets[imageAssets.length - 1]) y = top + cell + 14;
        }
      }

      const textIcons = icons.filter((i) => !i.image_url);
      if (textIcons.length) {
        ensure(20);
        y += 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...MAROON);
        doc.text("IKON SISTEM", M, y);
        y += 6;
        paragraph(textIcons.map((i) => `${i.name} (${i.icon}) — ${i.desc ?? ""}`).join("\n"), 9.5);
      }

      // ── Brand Voice ──────────────────────────────────────────
      newPage();
      sectionTitle("05 — Brand Voice", "Panduan Suara Brand");
      personality.forEach((p) => {
        ensure(20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...NAVY);
        doc.text(p.title || "-", M, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(...INK);
        const lines = doc.splitTextToSize(p.desc || "", W - M * 2);
        lines.forEach((l: string) => {
          ensure(6);
          doc.text(l, M, y);
          y += 5;
        });
        y += 4;
      });

      const voiceBlock = (title: string, items: string[], color: [number, number, number]) => {
        if (!items.length) return;
        ensure(20);
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
        y += 5;
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
