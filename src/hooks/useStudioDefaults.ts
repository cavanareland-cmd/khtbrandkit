import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StudioDefaults = Record<string, string>;

export function useStudioDefaults() {
  const [defaults, setDefaults] = useState<StudioDefaults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("brand_kit")
        .select("key,data")
        .eq("section", "studio_default")
        .order("sort_order");
      if (cancelled) return;
      const map: StudioDefaults = {};
      (data || []).forEach((r) => {
        const k = r.key as string | null;
        const v = (r.data as { value?: string } | null)?.value;
        if (k && typeof v === "string") map[k] = v;
      });
      setDefaults(map);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { defaults, loading };
}
