import { useState } from "react";
import { FileText, FolderArchive, Presentation, Download, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import EditButton from "./admin/EditButton";
import BrandKitPdfExport from "./BrandKitPdfExport";


const ProfileDownloads = () => {
  const [isEditing, setIsEditing] = useState(false);

  const downloadOptions = [
    {
      title: "Company Profile (PDF)",
      desc: "Dokumen resmi profil perusahaan versi terbaru untuk kebutuhan cetak atau pengiriman via email.",
      icon: FileText,
      format: "PDF",
      size: "4.2 MB",
      color: "bg-rose-50 text-rose-600",
    },
    {
      title: "Image Folder / Brand Kit",
      desc: "Kumpulan foto dokumentasi umrah, aset visual, dan elemen grafis dalam format ZIP/RAR.",
      icon: FolderArchive,
      format: "ZIP",
      size: "125 MB",
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Presentation Slide (PPTX)",
      desc: "Slide presentasi paket umrah dan penawaran kerjasama untuk kebutuhan meeting atau seminar.",
      icon: Presentation,
      format: "PPTX",
      size: "18.5 MB",
      color: "bg-sky-50 text-sky-600",
    },
  ];

  const handleDownload = (title: string) => {
    toast.success(`Mengunduh ${title}`, {
      description: "File sedang disiapkan oleh sistem.",
    });
  };

  return (
    <section id="downloads" className="py-12 md:py-24 bg-background relative">
      <div className="container px-4 mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="font-alt text-xs uppercase tracking-[0.3em] text-accent mb-4">06 — Downloads</p>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-secondary mb-4">Profil Perusahaan</h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Unduh aset resmi **Karin Hidayah Tour** dalam berbagai format untuk kebutuhan presentasi dan publikasi.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <BrandKitPdfExport />
            <EditButton onClick={() => setIsEditing(true)} label="Edit Aset" />
          </div>

        </div>

        {/* Download Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {downloadOptions.map((item, index) => (
            <Card key={index} className="group overflow-hidden border-border bg-card hover:shadow-elegant transition-smooth flex flex-col">
              <div className="p-8 flex-grow">
                <div className={`h-14 w-14 rounded-2xl ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-smooth shadow-sm`}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-bold text-secondary mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {item.desc}
                </p>
                <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <FileCheck className="h-3 w-3" /> {item.format}
                  </span>
                  <span>•</span>
                  <span>{item.size}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleDownload(item.title)}
                className="w-full py-4 bg-secondary text-secondary-foreground font-alt text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-secondary-glow transition-colors"
              >
                <Download className="h-4 w-4" />
                Unduh Sekarang
              </button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfileDownloads;
