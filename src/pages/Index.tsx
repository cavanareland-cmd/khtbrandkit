import Header from "@/components/brand/Header";
import Hero from "@/components/brand/Hero";
import ColorPalette from "@/components/brand/ColorPalette";
import Typography from "@/components/brand/Typography";
import AssetGallery from "@/components/brand/AssetGallery";
import BrandVoice from "@/components/brand/BrandVoice";
import ProfileDownloads from "@/components/brand/ProfileDownloads";
import Footer from "@/components/brand/Footer";
import MobileQuickMenu from "@/components/brand/MobileQuickMenu";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigasi Utama */}
      <Header />
      
      {/* Konten Utama dengan Kontainer Responsif */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <Hero />
        
        {/* Pembungkus Section dengan Spasi yang Konsisten */}
        <div className="space-y-16 md:space-y-24 py-8">
          <ColorPalette />
          <Typography />
          <AssetGallery />
          <BrandVoice />
          
          {/* Section Baru: Unduh Profil Perusahaan */}
          <ProfileDownloads />
        </div>
        
      </main>

      {/* Spacer bawah khusus Mobile agar konten tidak tertutup oleh MobileQuickMenu */}
      <div className="h-20 md:hidden" aria-hidden="true" />

      <Footer />

      {/* Menu Navigasi Cepat Khusus Mobile */}
      <MobileQuickMenu />
    </div>
  );
};

export default Index;
