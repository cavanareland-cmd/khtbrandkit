-- Creations table
CREATE TABLE public.creations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('a4_portrait', 'instagram_post', 'instagram_story', 'banner_landscape')),
  media_type TEXT NOT NULL DEFAULT 'flyer',
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_copy JSONB DEFAULT '{}'::jsonb,
  ai_brief JSONB DEFAULT '{}'::jsonb,
  background_image_url TEXT,
  text_layers JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'ready', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own creations"
  ON public.creations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creations"
  ON public.creations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creations"
  ON public.creations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creations"
  ON public.creations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_creations_user_id ON public.creations(user_id);
CREATE INDEX idx_creations_created_at ON public.creations(created_at DESC);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_creations_updated_at
  BEFORE UPDATE ON public.creations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for creation images (background + final exports)
INSERT INTO storage.buckets (id, name, public)
VALUES ('creations', 'creations', true);

-- Storage RLS policies
CREATE POLICY "Creation images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creations');

CREATE POLICY "Users can upload their own creation files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'creations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own creation files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'creations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own creation files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'creations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );