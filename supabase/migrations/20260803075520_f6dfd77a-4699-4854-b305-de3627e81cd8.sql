-- 1. Roles infrastructure
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Lock trigger helper function away from API roles
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3. brand_kit: admin-only writes
DROP POLICY IF EXISTS "Authenticated users can insert brand kit" ON public.brand_kit;
DROP POLICY IF EXISTS "Authenticated users can update brand kit" ON public.brand_kit;
DROP POLICY IF EXISTS "Authenticated users can delete brand kit" ON public.brand_kit;
CREATE POLICY "Admins can insert brand kit" ON public.brand_kit FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update brand kit" ON public.brand_kit FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete brand kit" ON public.brand_kit FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 4. cms_pages: admin-only writes
DROP POLICY IF EXISTS "Authenticated can insert pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Authenticated can update pages" ON public.cms_pages;
DROP POLICY IF EXISTS "Authenticated can delete pages" ON public.cms_pages;
CREATE POLICY "Admins can insert pages" ON public.cms_pages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update pages" ON public.cms_pages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete pages" ON public.cms_pages FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 5. cms_sections: admin-only writes
DROP POLICY IF EXISTS "Authenticated can insert sections" ON public.cms_sections;
DROP POLICY IF EXISTS "Authenticated can update sections" ON public.cms_sections;
DROP POLICY IF EXISTS "Authenticated can delete sections" ON public.cms_sections;
CREATE POLICY "Admins can insert sections" ON public.cms_sections FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update sections" ON public.cms_sections FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete sections" ON public.cms_sections FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- 6. brand-assets storage: admin-only writes, no listing
DROP POLICY IF EXISTS "Authenticated can upload brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Brand assets are publicly readable" ON storage.objects;
CREATE POLICY "Admins can upload brand assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update brand assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin')) WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete brand assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can list brand assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));

-- 7. templates storage: remove blanket public read (owner-only listing/read remains)
DROP POLICY IF EXISTS "Public can read individual template files" ON storage.objects;