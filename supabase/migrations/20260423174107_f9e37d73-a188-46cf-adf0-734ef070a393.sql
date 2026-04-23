-- Storage bucket for user-uploaded templates
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for templates bucket: users can manage their own files
CREATE POLICY "Templates are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');

CREATE POLICY "Users can upload their own templates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own templates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own templates"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Table for uploaded templates + AI analysis
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  preview_url TEXT,
  file_type TEXT NOT NULL,
  original_format TEXT,
  analysis JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates"
ON public.templates FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
ON public.templates FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
ON public.templates FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
ON public.templates FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add elements column to creations for the new multi-layer model
ALTER TABLE public.creations
  ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS template_id UUID,
  ADD COLUMN IF NOT EXISTS global_style JSONB DEFAULT '{}'::jsonb;