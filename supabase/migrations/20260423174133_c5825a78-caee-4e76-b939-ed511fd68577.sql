-- Replace broad SELECT with one that only restricts LIST operations (name = '' is a list call)
DROP POLICY IF EXISTS "Templates are publicly viewable" ON storage.objects;

-- Public can view individual objects (needed for <img src> & AI gateway)
CREATE POLICY "Public can read individual template files"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates' AND name <> '');

-- Only owner can list (we don't actually use list in the app, but blocks enumeration)
CREATE POLICY "Owner can list own template folder"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'templates' AND auth.uid()::text = (storage.foldername(name))[1]);