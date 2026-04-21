-- Brand Kit table: flexible store for all editable brand content
CREATE TABLE public.brand_kit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL, -- 'identity' | 'color' | 'typography' | 'voice_personality' | 'voice_do' | 'voice_dont' | 'voice_usage' | 'asset_logo' | 'asset_icon'
  key TEXT, -- optional unique key within section (e.g. 'hero_title', 'tagline')
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_kit_section ON public.brand_kit(section, sort_order);

ALTER TABLE public.brand_kit ENABLE ROW LEVEL SECURITY;

-- Public can read everything (homepage is public)
CREATE POLICY "Brand kit is viewable by everyone"
  ON public.brand_kit FOR SELECT
  USING (true);

-- Any signed-in user can manage entries
CREATE POLICY "Authenticated users can insert brand kit"
  ON public.brand_kit FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update brand kit"
  ON public.brand_kit FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete brand kit"
  ON public.brand_kit FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- updated_at trigger
CREATE TRIGGER trg_brand_kit_updated_at
  BEFORE UPDATE ON public.brand_kit
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for brand assets (logos, mockups, icons)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Brand assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated can upload brand assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated can update brand assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets');

CREATE POLICY "Authenticated can delete brand assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets');

-- ============= SEED DATA from existing hardcoded values =============

-- IDENTITY
INSERT INTO public.brand_kit (section, key, data, sort_order) VALUES
('identity', 'brand_name_primary', '{"value": "PT Karin"}', 1),
('identity', 'brand_name_secondary', '{"value": "Hidayah Tour"}', 2),
('identity', 'category_label', '{"value": "Travel Umrah & Haji"}', 3),
('identity', 'badge_label', '{"value": "Brand Identity Guidelines"}', 4),
('identity', 'tagline', '{"value": "Pelayanan Umrah yang Amanah, Khidmat, dan Nyaman bagi Setiap Tamu Allah."}', 5),
('identity', 'tag_pill', '{"value": "Amanah"}', 6),
('identity', 'tag_pill', '{"value": "Khidmat"}', 7),
('identity', 'tag_pill', '{"value": "Profesional"}', 8),
('identity', 'tag_pill', '{"value": "Berpengalaman"}', 9);

-- COLORS
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('color', '{"name":"Maroon Deep","role":"Primary Deep","hex":"#5C0A18","rgb":"92, 10, 24","hsl":"354 80% 22%","textOn":"light","category":"primary"}', 1),
('color', '{"name":"Maroon","role":"Primary","hex":"#8E1428","rgb":"142, 20, 40","hsl":"354 75% 32%","textOn":"light","category":"primary"}', 2),
('color', '{"name":"Maroon Glow","role":"Primary Glow","hex":"#C13449","rgb":"193, 52, 73","hsl":"354 70% 45%","textOn":"light","category":"primary"}', 3),
('color', '{"name":"Navy Deep","role":"Secondary","hex":"#101F4C","rgb":"16, 31, 76","hsl":"220 65% 18%","textOn":"light","category":"secondary"}', 4),
('color', '{"name":"Navy","role":"Secondary Glow","hex":"#22386F","rgb":"34, 56, 111","hsl":"220 55% 30%","textOn":"light","category":"secondary"}', 5),
('color', '{"name":"Royal Gold","role":"Accent","hex":"#C99A3F","rgb":"201, 154, 63","hsl":"38 55% 52%","textOn":"dark","category":"accent"}', 6),
('color', '{"name":"Gold Soft","role":"Accent Soft","hex":"#F5E6C5","rgb":"245, 230, 197","hsl":"38 70% 88%","textOn":"dark","category":"accent"}', 7),
('color', '{"name":"Ivory","role":"Background","hex":"#FBF8F3","rgb":"251, 248, 243","hsl":"40 33% 98%","textOn":"dark","category":"neutral"}', 8),
('color', '{"name":"Stone","role":"Muted","hex":"#EFEBE3","rgb":"239, 235, 227","hsl":"40 20% 94%","textOn":"dark","category":"neutral"}', 9),
('color', '{"name":"Ink","role":"Foreground","hex":"#111A2C","rgb":"17, 26, 44","hsl":"220 45% 12%","textOn":"light","category":"neutral"}', 10);

-- TYPOGRAPHY
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('typography', '{"name":"Playfair Display","role":"Heading Font","className":"font-display","weight":"400 — 900","sample":"Aa","desc":"Untuk judul, hero, dan momen bermartabat."}', 1),
('typography', '{"name":"Inter","role":"Body Font","className":"font-body","weight":"300 — 700","sample":"Aa","desc":"Untuk paragraf, UI, dan keterbacaan optimal."}', 2),
('typography', '{"name":"Montserrat","role":"Accent Font","className":"font-alt","weight":"300 — 700","sample":"Aa","desc":"Untuk label, caption, dan call-to-action."}', 3);

-- VOICE PERSONALITY
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('voice_personality', '{"icon":"Shield","title":"Amanah","desc":"Setiap janji ditepati. Setiap dana dikelola dengan penuh tanggung jawab dan transparansi."}', 1),
('voice_personality', '{"icon":"Heart","title":"Khidmat","desc":"Pelayanan dengan ketulusan hati, menghormati setiap jamaah sebagai tamu Allah."}', 2),
('voice_personality', '{"icon":"Sparkles","title":"Profesional","desc":"Standar pelayanan tinggi, sistematis, dan terstruktur dari awal hingga akhir perjalanan."}', 3),
('voice_personality', '{"icon":"Users","title":"Hangat","desc":"Komunikasi penuh kekeluargaan — jamaah bukan sekadar pelanggan, tapi keluarga."}', 4);

-- VOICE DO
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('voice_do', '{"text":"Mantapkan niat ibadah Anda bersama KHT."}', 1),
('voice_do', '{"text":"Pendampingan penuh selama perjalanan suci Anda."}', 2),
('voice_do', '{"text":"Insya Allah, perjalanan Anda akan berkah dan nyaman."}', 3);

-- VOICE DON'T
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('voice_dont', '{"text":"Promo gila-gilaan! Murah meriah!"}', 1),
('voice_dont', '{"text":"Beli sekarang sebelum kehabisan!!!"}', 2),
('voice_dont', '{"text":"Paket termurah se-Indonesia, dijamin!"}', 3);

-- VOICE USAGE (Dos & Don'ts accordion)
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('voice_usage', '{"q":"Penggunaan Logo yang Benar","do":["Selalu sediakan ruang kosong (clear space) minimal setara dengan tinggi logo.","Gunakan versi berwarna pada latar terang, versi putih pada latar gelap.","Pertahankan proporsi asli logo saat memperbesar atau memperkecil."],"dont":["Jangan mengubah warna, memutar, atau mendistorsi logo.","Jangan menempatkan logo pada latar yang ramai atau low-contrast.","Jangan menambahkan efek bayangan, glow, atau outline pada logo."]}', 1),
('voice_usage', '{"q":"Penggunaan Warna","do":["Gunakan Maroon sebagai warna dominan untuk elemen utama.","Navy untuk hierarki kedua dan teks heading.","Gold sebagai aksen — gunakan secukupnya untuk highlight."],"dont":["Jangan mencampur warna brand dengan warna pesaing atau warna yang bertabrakan.","Hindari penggunaan warna neon atau saturasi tinggi yang tidak ada di palet.","Jangan gunakan warna primary di atas warna primary (no-contrast)."]}', 2),
('voice_usage', '{"q":"Penggunaan Tipografi","do":["Playfair Display untuk judul utama saja.","Inter untuk semua body text dan UI.","Montserrat dengan tracking lebar untuk label dan caption."],"dont":["Jangan menggunakan lebih dari 3 ukuran font berbeda dalam satu desain.","Hindari penggunaan font dekoratif di luar trio brand.","Jangan gunakan all-caps untuk paragraf panjang."]}', 3),
('voice_usage', '{"q":"Bahasa & Komunikasi","do":["Gunakan kata ''Bismillah'', ''Insya Allah'', ''Barakallah'' secara natural dan tepat konteks.","Sapa jamaah dengan ''Bapak/Ibu'' dengan hormat.","Jelaskan layanan dengan jelas, tanpa janji berlebihan."],"dont":["Hindari clickbait, hard-selling, dan bahasa hiperbola.","Jangan gunakan bahasa gaul atau singkatan tidak baku di komunikasi resmi.","Jangan membandingkan secara negatif dengan kompetitor."]}', 4);

-- ASSET LOGOS
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('asset_logo', '{"title":"Logo Penuh","subtitle":"Primary Mark","bg":"bg-card","border":"border-border","inverse":false,"image_url":null}', 1),
('asset_logo', '{"title":"Versi Putih","subtitle":"On Dark Background","bg":"bg-secondary","border":"border-secondary","inverse":true,"image_url":null}', 2),
('asset_logo', '{"title":"Versi Maroon","subtitle":"On Light Background","bg":"bg-accent-soft","border":"border-accent/30","inverse":false,"image_url":null}', 3);

-- ASSET ICONS
INSERT INTO public.brand_kit (section, data, sort_order) VALUES
('asset_icon', '{"icon":"Kaaba","name":"Ka''bah","desc":"Holy Site"}', 1),
('asset_icon', '{"icon":"Plane","name":"Pesawat","desc":"Transportation"}', 2),
('asset_icon', '{"icon":"Building2","name":"Hotel","desc":"Accommodation"}', 3),
('asset_icon', '{"icon":"Bus","name":"Bus","desc":"Ground Transport"}', 4),
('asset_icon', '{"icon":"Compass","name":"Manasik","desc":"Guidance"}', 5),
('asset_icon', '{"icon":"BookOpen","name":"E-Guide","desc":"Digital Material"}', 6),
('asset_icon', '{"icon":"MapPin","name":"Tour Spot","desc":"Locations"}', 7);