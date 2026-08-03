import { supabase } from "@/integrations/supabase/client";

const BUCKET = "templates";

/** Extract the storage object path from a stored templates URL (public or signed). */
export function templatePathFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const marker = `/object/public/${BUCKET}/`;
  const signMarker = `/object/sign/${BUCKET}/`;
  const idx = url.includes(marker) ? url.indexOf(marker) + marker.length
    : url.includes(signMarker) ? url.indexOf(signMarker) + signMarker.length
    : -1;
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx).split("?")[0]);
}

/** Create a short-lived signed URL for a private templates file. */
export async function signTemplateUrl(url?: string | null, expiresIn = 3600): Promise<string | null> {
  if (!url) return null;
  const path = templatePathFromUrl(url);
  if (!path) return url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
