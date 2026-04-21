-- Tighten SELECT to owner only (still allows public URL access by direct link via public bucket)
DROP POLICY IF EXISTS "Creation images are publicly viewable" ON storage.objects;

CREATE POLICY "Users can view their own creation files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'creations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );