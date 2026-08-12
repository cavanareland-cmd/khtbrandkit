// import Header from "@/components/brand/Header"; // Header dinonaktifkan
import Hero from "@/components/brand/Hero";
import ColorPalette from "@/components/brand/ColorPalette";
import Typography from "@/components/brand/Typography";
import AssetGallery from "@/components/brand/AssetGallery";
import BrandVoice from "@/components/brand/BrandVoice";
import ProfileDownloads from "@/components/brand/ProfileDownloads";
// import Footer from "@/components/brand/Footer"; // Footer dinonaktifkan
import MobileQuickMenu from "@/components/brand/MobileQuickMenu";

const Index = () => {
  return (
    // Mengubah bg-background menjadi bg-transparent agar menyatu dengan website utama saat di-embed
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Header bawaan dihapus agar tidak bentrok dengan Header website utama */}
      
      {/* Konten Utama dengan Kontainer Responsif */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4">

        {/* Menu Navigasi Cepat (semua ukuran layar) */}
        <MobileQuickMenu />

        {/* Hero Section */}
        <Hero />
        
        {/* Pembungkus Section: Spasi (space-y) sedikit dirapatkan agar lebih fit di dalam Iframe */}
        <div className="space-y-10 md:space-y-16 py-6">
          <ColorPalette />
          <Typography />
          <AssetGallery />
          <BrandVoice />
          
          {/* Section Baru: Unduh Profil Perusahaan */}
          <ProfileDownloads />
        </div>
        
      </main>

      <div className="h-8" aria-hidden="true" />
    </div>
  );
};

export default Index;
