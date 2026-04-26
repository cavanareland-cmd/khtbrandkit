import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CmsSection = {
  id: string;
  page_slug: string;
  section_key: string;
  block_key: string | null;
  label: string | null;
  content: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

/** Hook untuk membaca sections satu page (realtime). */
export function useCmsPage(pageSlug: string) {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("cms_sections")
      .select("*")
      .eq("page_slug", pageSlug)
      .order("section_key", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) console.error(error);
    setSections((data ?? []) as unknown as CmsSection[]);
    setLoading(false);
  }, [pageSlug]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`cms_${pageSlug}_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cms_sections", filter: `page_slug=eq.${pageSlug}` },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pageSlug, refresh]);

  /** Ambil 1 block dari sebuah section_key (yang biasanya hanya punya 1 block "main"). */
  const block = (sectionKey: string, blockKey = "main"): Record<string, unknown> => {
    const found = sections.find((s) => s.section_key === sectionKey && (s.block_key ?? "main") === blockKey);
    return found?.content ?? {};
  };

  /** Ambil semua block dari section_key (untuk list / repeater). */
  const list = (sectionKey: string): CmsSection[] =>
    sections.filter((s) => s.section_key === sectionKey && s.is_visible).sort((a, b) => a.sort_order - b.sort_order);

  return { sections, loading, refresh, block, list };
}

/** CRUD helpers untuk admin. */
export async function upsertSection(
  id: string | null,
  patch: Partial<Pick<CmsSection, "page_slug" | "section_key" | "block_key" | "label" | "content" | "sort_order" | "is_visible">>,
) {
  if (id) {
    const { error } = await supabase
      .from("cms_sections")
      .update({
        ...(patch.content !== undefined ? { content: patch.content as never } : {}),
        ...(patch.label !== undefined ? { label: patch.label } : {}),
        ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
        ...(patch.is_visible !== undefined ? { is_visible: patch.is_visible } : {}),
        ...(patch.block_key !== undefined ? { block_key: patch.block_key } : {}),
      })
      .eq("id", id);
    if (error) {
      toast.error("Gagal simpan: " + error.message);
      return false;
    }
    return true;
  }
  if (!patch.page_slug || !patch.section_key) {
    toast.error("page_slug & section_key wajib");
    return false;
  }
  const { error } = await supabase.from("cms_sections").insert({
    page_slug: patch.page_slug,
    section_key: patch.section_key,
    block_key: patch.block_key ?? "main",
    label: patch.label ?? null,
    content: (patch.content ?? {}) as never,
    sort_order: patch.sort_order ?? 0,
    is_visible: patch.is_visible ?? true,
  });
  if (error) {
    toast.error("Gagal tambah: " + error.message);
    return false;
  }
  return true;
}

export async function deleteSection(id: string) {
  const { error } = await supabase.from("cms_sections").delete().eq("id", id);
  if (error) {
    toast.error("Gagal hapus: " + error.message);
    return false;
  }
  return true;
}
