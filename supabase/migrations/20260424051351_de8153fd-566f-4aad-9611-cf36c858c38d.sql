-- Media library: user-uploaded knowledge sources for AI
CREATE TABLE public.media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  preview_url TEXT,
  file_type TEXT NOT NULL,
  original_format TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded',
  extracted_text TEXT,
  extracted_meta JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own media" ON public.media_library
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own media" ON public.media_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own media" ON public.media_library
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own media" ON public.media_library
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_media_library_user ON public.media_library(user_id, created_at DESC);

-- Storage bucket for media library
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-library', 'media-library', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media-library"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-library');

CREATE POLICY "Users upload own media-library"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own media-library"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own media-library"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media-library' AND auth.uid()::text = (storage.foldername(name))[1]);