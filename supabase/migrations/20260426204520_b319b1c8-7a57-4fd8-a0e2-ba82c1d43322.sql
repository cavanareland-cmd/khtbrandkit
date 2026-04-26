-- ============ CMS PAGES ============
CREATE TABLE public.cms_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pages viewable by everyone"
  ON public.cms_pages FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert pages"
  ON public.cms_pages FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update pages"
  ON public.cms_pages FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete pages"
  ON public.cms_pages FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_cms_pages_updated_at
  BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CMS SECTIONS ============
CREATE TABLE public.cms_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_slug TEXT NOT NULL,
  section_key TEXT NOT NULL,
  block_key TEXT,
  label TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cms_sections_page_section ON public.cms_sections(page_slug, section_key, sort_order);

ALTER TABLE public.cms_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sections viewable by everyone"
  ON public.cms_sections FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert sections"
  ON public.cms_sections FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update sections"
  ON public.cms_sections FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete sections"
  ON public.cms_sections FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_cms_sections_updated_at
  BEFORE UPDATE ON public.cms_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED PAGES ============
INSERT INTO public.cms_pages (slug, title, description) VALUES
  ('company-profile', 'Company Profile', 'Halaman profil perusahaan KHT'),
  ('index', 'Landing Page', 'Halaman utama / landing brand kit');

-- ============ SEED SECTIONS: COMPANY PROFILE ============
INSERT INTO public.cms_sections (page_slug, section_key, block_key, label, content, sort_order) VALUES
-- HERO
('company-profile', 'hero', 'main', 'Hero Section', '{
  "badge": "Company Profile · Sejak 2014",
  "title_line1": "Memuliakan",
  "title_highlight": "Tamu Allah",
  "title_line3": "dengan Penuh Khidmat.",
  "tagline": "\"Labbaik Allahumma Labbaik\" — kami menemani langkah pertama hingga doa terakhir Anda di Tanah Suci.",
  "cta_primary_label": "Lihat Program Kami",
  "cta_primary_href": "#programs",
  "cta_secondary_label": "Hubungi Kami",
  "cta_secondary_href": "#contact"
}'::jsonb, 1),

-- STATS (4 items)
('company-profile', 'stats', 'item-1', 'Stat 1', '{"value":"10+","label":"Tahun Pengalaman","icon":"Award"}'::jsonb, 1),
('company-profile', 'stats', 'item-2', 'Stat 2', '{"value":"5,000+","label":"Jamaah Terlayani","icon":"Users"}'::jsonb, 2),
('company-profile', 'stats', 'item-3', 'Stat 3', '{"value":"98%","label":"Tingkat Kepuasan","icon":"Star"}'::jsonb, 3),
('company-profile', 'stats', 'item-4', 'Stat 4', '{"value":"12+","label":"Mitra Hotel ★★★★★","icon":"Building2"}'::jsonb, 4),

-- TENTANG
('company-profile', 'about', 'main', 'Tentang Kami', '{
  "eyebrow": "Tentang Kami",
  "title": "Lebih dari satu dekade menemani perjalanan suci.",
  "title_highlight": "menemani perjalanan suci",
  "paragraph_1": "PT Karin Hidayah Tour adalah penyelenggara perjalanan ibadah Umrah dan Haji Khusus yang resmi terdaftar di Kementerian Agama Republik Indonesia. Kami berkomitmen menghadirkan pengalaman ibadah yang amanah, khidmat, dan nyaman bagi setiap tamu Allah.",
  "paragraph_2": "Dipercaya oleh ribuan jamaah dari seluruh nusantara, kami memadukan ketelitian operasional dengan sentuhan kekeluargaan — agar setiap langkah Anda di Tanah Suci dipenuhi keberkahan.",
  "since_year": "2014",
  "checklist": ["Berizin Resmi PPIU & PIHK","Pembimbing Bersertifikat","Hotel Premium ★★★★+","Direct Flight Garuda / Saudia"]
}'::jsonb, 1),

-- VISI MISI
('company-profile', 'vision_mission', 'main', 'Visi & Misi', '{
  "eyebrow": "Visi & Misi",
  "title": "Arah perjalanan kami.",
  "vision": "Menjadi mitra perjalanan ibadah pilihan utama umat Islam Indonesia, dengan pelayanan yang amanah, profesional, dan berlandaskan sunnah.",
  "missions": [
    "Menyelenggarakan ibadah Umrah & Haji yang khusyuk dan tertib.",
    "Memberikan pendampingan manasik sesuai tuntunan sunnah.",
    "Menjaga transparansi biaya & jadwal keberangkatan.",
    "Menghadirkan pengalaman premium dengan harga yang adil."
  ]
}'::jsonb, 1),

-- VALUES (4 items)
('company-profile', 'values', 'item-1', 'Nilai 1', '{"icon":"ShieldCheck","title":"Amanah","desc":"Setiap kepercayaan jamaah kami jaga dengan penuh tanggung jawab — dari niat awal hingga kembali ke tanah air."}'::jsonb, 1),
('company-profile', 'values', 'item-2', 'Nilai 2', '{"icon":"HeartHandshake","title":"Khidmat","desc":"Pelayanan tulus, ramah, dan personal. Kami memuliakan tamu Allah seperti memuliakan keluarga sendiri."}'::jsonb, 2),
('company-profile', 'values', 'item-3', 'Nilai 3', '{"icon":"Sparkles","title":"Kenyamanan","desc":"Akomodasi premium, transportasi terjadwal rapi, dan pendampingan penuh agar ibadah lebih khusyuk."}'::jsonb, 3),
('company-profile', 'values', 'item-4', 'Nilai 4', '{"icon":"Compass","title":"Bimbingan Manasik","desc":"Dipandu pembimbing bersertifikat sesuai sunnah, dengan kurikulum manasik yang terstruktur."}'::jsonb, 4),

-- PROGRAMS (3 items)
('company-profile', 'programs', 'item-1', 'Program 1', '{"badge":"Paling Diminati","title":"Umrah Reguler 9 Hari","desc":"Paket esensial dengan keberangkatan rutin dari Jakarta. Hotel ★★★★ dekat Masjidil Haram & Masjid Nabawi.","features":["Direct Flight","Hotel ★★★★ < 500m","Manasik 3x","Muthawwif Senior"]}'::jsonb, 1),
('company-profile', 'programs', 'item-2', 'Program 2', '{"badge":"Spesial","title":"Umrah Plus Turki / Aqsa","desc":"Sempurnakan perjalanan dengan ziarah ke Istanbul atau Masjidil Aqsa. Perpanjangan 4-6 hari.","features":["Hotel ★★★★★","City Tour Lengkap","Tour Guide Lokal","Visa Multi-Entry"]}'::jsonb, 2),
('company-profile', 'programs', 'item-3', 'Program 3', '{"badge":"Premium","title":"Haji Plus Khusus","desc":"Program haji dengan layanan eksklusif, kuota terbatas, dan akomodasi terdekat dengan Masjidil Haram.","features":["Maktab VIP","Tenda Mina ber-AC","Hotel < 200m","Pembimbing 24/7"]}'::jsonb, 3),

-- TIMELINE (5 items)
('company-profile', 'timeline', 'item-1', '2014', '{"year":"2014","text":"PT Karin Hidayah Tour didirikan dengan misi menjadi mitra terpercaya tamu Allah."}'::jsonb, 1),
('company-profile', 'timeline', 'item-2', '2017', '{"year":"2017","text":"Mendapatkan izin resmi PPIU & PIHK dari Kementerian Agama RI."}'::jsonb, 2),
('company-profile', 'timeline', 'item-3', '2019', '{"year":"2019","text":"Memberangkatkan jamaah ke-1.000 dengan tingkat kepuasan 98%."}'::jsonb, 3),
('company-profile', 'timeline', 'item-4', '2022', '{"year":"2022","text":"Membuka program Umrah Plus Turki dan Al-Aqsa secara reguler."}'::jsonb, 4),
('company-profile', 'timeline', 'item-5', '2024', '{"year":"2024","text":"Diversifikasi kuota Haji Plus dan kemitraan strategis dengan hotel premium di Mekkah & Madinah."}'::jsonb, 5),

-- TESTIMONIALS (3 items)
('company-profile', 'testimonials', 'item-1', 'Testi 1', '{"name":"H. Ahmad Fauzi","role":"Jamaah Umrah 2024","quote":"Pelayanan luar biasa, pembimbing sabar, hotel sangat dekat dengan Masjidil Haram. Insya Allah tahun depan ikut lagi bersama keluarga."}'::jsonb, 1),
('company-profile', 'testimonials', 'item-2', 'Testi 2', '{"name":"Hj. Siti Aminah","role":"Jamaah Umrah Plus Turki","quote":"Perjalanan paling berkesan dalam hidup. Tim KHT memperhatikan detail sekecil apapun, mulai dari makanan hingga kursi roda untuk ibu saya."}'::jsonb, 2),
('company-profile', 'testimonials', 'item-3', 'Testi 3', '{"name":"H. Budi Santoso","role":"Jamaah Haji Plus 2023","quote":"Amanah dan profesional. Sejak pendaftaran hingga kepulangan, semua transparan dan tepat waktu. Barakallah untuk tim Karin Hidayah Tour."}'::jsonb, 3),

-- CTA & CONTACT
('company-profile', 'cta', 'main', 'Final CTA', '{
  "title": "Siap memulai perjalanan suci Anda?",
  "subtitle": "Konsultasi gratis dengan tim KHT untuk menemukan paket yang tepat.",
  "button_label": "Konsultasi via WhatsApp",
  "button_href": "https://wa.me/6281234567890"
}'::jsonb, 1),

('company-profile', 'contact', 'main', 'Kontak', '{
  "address": "Jl. Contoh No. 123, Jakarta Selatan, DKI Jakarta",
  "phone": "+62 812-3456-7890",
  "email": "info@karinhidayahtour.co.id",
  "whatsapp": "6281234567890"
}'::jsonb, 1);

-- ============ SEED SECTIONS: INDEX (Landing) ============
INSERT INTO public.cms_sections (page_slug, section_key, block_key, label, content, sort_order) VALUES
('index', 'hero', 'main', 'Hero Landing', '{
  "title": "Brand Kit & AI Studio",
  "subtitle": "Desain promo Umrah & Haji premium dengan AI",
  "cta_label": "Mulai Sekarang",
  "cta_href": "/studio"
}'::jsonb, 1);
