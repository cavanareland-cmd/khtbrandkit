import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BrandKitEntry = {
  id: string;
  section: string;
  key: string | null;
  data: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function useBrandKit(section: string) {
  const [entries, setEntries] = useState<BrandKitEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("brand_kit")
      .select("*")
      .eq("section", section)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setEntries((data ?? []) as unknown as BrandKitEntry[]);
    }
    setLoading(false);
  }, [section]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`brand_kit_${section}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_kit", filter: `section=eq.${section}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [section, refresh]);

  const upsertEntry = async (id: string | null, patch: Partial<BrandKitEntry>) => {
    if (id) {
      const { error } = await supabase
        .from("brand_kit")
        .update({
          ...(patch.data !== undefined ? { data: patch.data as never } : {}),
          ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
          ...(patch.key !== undefined ? { key: patch.key } : {}),
        })
        .eq("id", id);
      if (error) {
        toast.error("Gagal menyimpan: " + error.message);
        return false;
      }
    } else {
      const { error } = await supabase.from("brand_kit").insert({
        section,
        key: patch.key ?? null,
        data: (patch.data ?? {}) as never,
        sort_order: patch.sort_order ?? entries.length + 1,
      });
      if (error) {
        toast.error("Gagal menambah: " + error.message);
        return false;
      }
    }
    return true;
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("brand_kit").delete().eq("id", id);
    if (error) {
      toast.error("Gagal hapus: " + error.message);
      return false;
    }
    return true;
  };

  return { entries, loading, refresh, upsertEntry, deleteEntry };
}
