-- Tighten: only owner can list, but URLs remain publicly readable when known
DROP POLICY IF EXISTS "Public read media-library" ON storage.objects;

CREATE POLICY "Owner list media-library"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'media-library'
    AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR auth.role() = 'service_role'
    )
  );