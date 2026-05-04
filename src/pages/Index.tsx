import Header from "@/components/brand/Header";
import Hero from "@/components/brand/Hero";
import ColorPalette from "@/components/brand/ColorPalette";
import Typography from "@/components/brand/Typography";
import AssetGallery from "@/components/brand/AssetGallery";
import BrandVoice from "@/components/brand/BrandVoice";
import Footer from "@/components/brand/Footer";
import MobileQuickMenu from "@/components/brand/MobileQuickMenu";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <MobileQuickMenu />
      <main>
        <Hero />
        <ColorPalette />
        <Typography />
        <AssetGallery />
        <BrandVoice />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
