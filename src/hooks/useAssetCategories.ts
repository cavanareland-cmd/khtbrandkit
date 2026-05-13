import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plane, Compass, Smartphone, Square as SquareIcon, MonitorPlay,
  ImageIcon, Sparkles, FileImage, Wand2, type LucideIcon,
} from "lucide-react";

export type AssetCategory = {
  key: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  iconName: string;
  format: string;
  accent: string;
};

const ICONS: Record<string, LucideIcon> = {
  Plane, Compass, Smartphone, Square: SquareIcon, MonitorPlay,
  ImageIcon, Sparkles, FileImage, Wand2,
};

const FALLBACK: AssetCategory[] = [
  { key: "umrah_poster", title: "Poster / Brosur Paket Umrah", desc: "Promosi paket umrah lengkap dengan harga & fasilitas", icon: Plane, iconName: "Plane", format: "1080x1350", accent: "from-primary/20 to-secondary/20" },
  { key: "hajj_poster", title: "Poster Paket Haji", desc: "Aset promosi paket haji premium & reguler", icon: Compass, iconName: "Compass", format: "1080x1350", accent: "from-secondary/20 to-accent/20" },
  { key: "story_promo", title: "Story Promo (IG / WA)", desc: "Format vertikal 9:16 untuk story & status", icon: Smartphone, iconName: "Smartphone", format: "1080x1920", accent: "from-accent/20 to-primary/20" },
  { key: "feed_square", title: "Feed Square", desc: "Format kotak 1:1 untuk Instagram Feed", icon: SquareIcon, iconName: "Square", format: "1080x1080", accent: "from-primary/20 to-accent/20" },
  { key: "social_universal", title: "Sosial Media Universal", desc: "Format multi-platform (FB, TikTok, X, dll)", icon: MonitorPlay, iconName: "MonitorPlay", format: "1080x1350", accent: "from-secondary/20 to-primary/20" },
];

export function useAssetCategories() {
  const [categories, setCategories] = useState<AssetCategory[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("brand_kit")
        .select("key,data,sort_order")
        .eq("section", "asset_category")
        .order("sort_order", { ascending: true });
      if (!mounted) return;
      if (data && data.length > 0) {
        const mapped: AssetCategory[] = data.map((r) => {
          const d = (r.data ?? {}) as Record<string, string>;
          const iconName = d.icon || "ImageIcon";
          return {
            key: d.key || r.key || "",
            title: d.title || "",
            desc: d.desc || "",
            iconName,
            icon: ICONS[iconName] || ImageIcon,
            format: d.format || "1080x1350",
            accent: d.accent || "from-primary/20 to-secondary/20",
          };
        }).filter((c) => c.key && c.title);
        if (mapped.length > 0) setCategories(mapped);
      }
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel(`asset_cat_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "brand_kit", filter: "section=eq.asset_category" }, () => load())
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, []);

  return { categories, loading, iconList: Object.keys(ICONS) };
}
