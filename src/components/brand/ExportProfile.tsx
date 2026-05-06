import { useState } from "react";
import { Download, FileText, Presentation, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoUrl from "@/assets/karin-logo.png";

type ExportKind = "pdf" | "pptx";

const FILE_NAME = "Karin-Hidayah-Tour-Company-Profile";
const COMPANY_NAME = "Karin Hidayah Tour";
const COMPANY_TAGLINE = "Company Profile · Umrah & Haji Plus";

const formatDateID = (d = new Date()) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

async function loadImageAsDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

async function captureNode(node: HTMLElement, scale = 1.5) {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas(node, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: node.scrollWidth,
  });
}

// Brand palette (selaras dengan tema secondary di app)
const BRAND_BG = "#2A0F1A"; // deep maroon
const BRAND_ACCENT = "#C9A35C"; // gold

function drawPdfCover(pdf: import("jspdf").jsPDF, logoDataUrl: string) {
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Background
  pdf.setFillColor(BRAND_BG);
  pdf.rect(0, 0, pageW, pageH, "F");

  // Accent bar
  pdf.setFillColor(BRAND_ACCENT);
  pdf.rect(0, pageH - 24, pageW, 24, "F");

  // Logo (centered)
  const logoSize = 140;
  try {
    pdf.addImage(
      logoDataUrl,
      "PNG",
      (pageW - logoSize) / 2,
      pageH * 0.22,
      logoSize,
      logoSize,
      undefined,
      "FAST",
    );
  } catch {
    /* ignore */
  }

  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(34);
  pdf.text(COMPANY_NAME, pageW / 2, pageH * 0.22 + logoSize + 60, { align: "center" });

  // Tagline
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(220, 200, 170);
  pdf.text(COMPANY_TAGLINE, pageW / 2, pageH * 0.22 + logoSize + 88, { align: "center" });

  // Export date
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Diekspor pada ${formatDateID()}`, pageW / 2, pageH - 56, { align: "center" });
}

async function exportPdf() {
  const root = document.getElementById("company-profile-export-root");
  if (!root) throw new Error("Konten tidak ditemukan");

  const sections = Array.from(root.querySelectorAll<HTMLElement>("section"));
  const targets = sections.length ? sections : [root];

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Cover page
  const logoDataUrl = await loadImageAsDataUrl(logoUrl).catch(() => "");
  drawPdfCover(pdf, logoDataUrl);

  for (let i = 0; i < targets.length; i++) {
    const canvas = await captureNode(targets[i]);
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const ratio = canvas.width / canvas.height;
    let w = pageW;
    let h = w / ratio;
    if (h > pageH) {
      h = pageH;
      w = h * ratio;
    }
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", x, y, w, h, undefined, "FAST");
  }

  pdf.save(`${FILE_NAME}.pdf`);
}

async function exportPptx() {
  const root = document.getElementById("company-profile-export-root");
  if (!root) throw new Error("Konten tidak ditemukan");

  const sections = Array.from(root.querySelectorAll<HTMLElement>("section"));
  const targets = sections.length ? sections : [root];

  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
  pptx.title = `${COMPANY_NAME} — Company Profile`;

  const slideW = 13.333;
  const slideH = 7.5;

  // Cover slide
  const logoDataUrl = await loadImageAsDataUrl(logoUrl).catch(() => "");
  const cover = pptx.addSlide();
  cover.background = { color: BRAND_BG.replace("#", "") };
  if (logoDataUrl) {
    cover.addImage({
      data: logoDataUrl,
      x: (slideW - 2) / 2,
      y: 1.6,
      w: 2,
      h: 2,
    });
  }
  cover.addText(COMPANY_NAME, {
    x: 0.5,
    y: 3.9,
    w: slideW - 1,
    h: 0.9,
    fontSize: 44,
    bold: true,
    color: "FFFFFF",
    align: "center",
    fontFace: "Georgia",
  });
  cover.addText(COMPANY_TAGLINE, {
    x: 0.5,
    y: 4.8,
    w: slideW - 1,
    h: 0.5,
    fontSize: 18,
    color: "DCC8AA",
    align: "center",
    fontFace: "Calibri",
  });
  cover.addText(`Diekspor pada ${formatDateID()}`, {
    x: 0.5,
    y: 6.6,
    w: slideW - 1,
    h: 0.4,
    fontSize: 12,
    color: "FFFFFF",
    align: "center",
  });
  cover.addShape("rect", {
    x: 0,
    y: slideH - 0.25,
    w: slideW,
    h: 0.25,
    fill: { color: BRAND_ACCENT.replace("#", "") },
    line: { color: BRAND_ACCENT.replace("#", "") },
  });

  for (const node of targets) {
    const canvas = await captureNode(node, 1.25);
    const data = canvas.toDataURL("image/jpeg", 0.9);
    const ratio = canvas.width / canvas.height;
    let w = slideW;
    let h = w / ratio;
    if (h > slideH) {
      h = slideH;
      w = h * ratio;
    }
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({
      data,
      x: (slideW - w) / 2,
      y: (slideH - h) / 2,
      w,
      h,
    });
  }

  await pptx.writeFile({ fileName: `${FILE_NAME}.pptx` });
}


const ExportProfile = () => {
  const [loading, setLoading] = useState<ExportKind | null>(null);

  const handle = async (kind: ExportKind) => {
    if (loading) return;
    setLoading(kind);
    const tId = toast.loading(
      kind === "pdf" ? "Menyiapkan PDF…" : "Menyiapkan Slide PPTX…",
      { description: "Proses ini bisa beberapa detik tergantung panjang halaman." },
    );
    try {
      if (kind === "pdf") await exportPdf();
      else await exportPptx();
      toast.success(
        kind === "pdf" ? "PDF berhasil diunduh" : "Slide PPTX berhasil diunduh",
        { id: tId },
      );
    } catch (e) {
      console.error(e);
      toast.error("Gagal mengekspor", {
        id: tId,
        description: e instanceof Error ? e.message : "Terjadi kesalahan tak terduga.",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="container px-4 mx-auto pb-12 md:pb-16 flex justify-center print:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-secondary text-secondary-foreground px-5 py-3 text-sm font-medium shadow-elegant hover:bg-secondary/90 transition-smooth"
            aria-label="Export Company Profile"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Export Profil</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>Unduh Company Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handle("pdf")}
            disabled={!!loading}
            className="gap-3 py-3"
          >
            <span className="h-9 w-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">Export PDF</span>
              <span className="text-[11px] text-muted-foreground">A4 · multi-halaman</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handle("pptx")}
            disabled={!!loading}
            className="gap-3 py-3"
          >
            <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Presentation className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">Export Google Slide</span>
              <span className="text-[11px] text-muted-foreground">Format .pptx (impor ke Slides)</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
};

export default ExportProfile;
