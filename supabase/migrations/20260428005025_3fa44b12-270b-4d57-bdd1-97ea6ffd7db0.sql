ALTER TABLE public.templates 
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS format text;

CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_format ON public.templates(format);