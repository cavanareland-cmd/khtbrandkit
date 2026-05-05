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

type ExportKind = "pdf" | "pptx";

const FILE_NAME = "Karin-Hidayah-Tour-Company-Profile";

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

async function exportPdf() {
  const root = document.getElementById("company-profile-export-root");
  if (!root) throw new Error("Konten tidak ditemukan");

  const sections = Array.from(root.querySelectorAll<HTMLElement>("section"));
  const targets = sections.length ? sections : [root];

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

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
    if (i > 0) pdf.addPage();
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
  pptx.title = "Karin Hidayah Tour — Company Profile";

  const slideW = 13.333;
  const slideH = 7.5;

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
