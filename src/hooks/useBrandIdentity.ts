import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BrandIdentity = {
  brandName: string;
  brandShort: string;
  categoryLabel: string;
  tagline: string;
  badgeLabel: string;
  /** Mark / icon logo (square). Falls back to bundled asset when empty. */
  logoUrl: string | null;
  /** Full lockup (mark + wordmark) when available. */
  lockupUrl: string | null;
  /** Inverse (white) logo for dark backgrounds. */
  logoInverseUrl: string | null;
  loading: boolean;
};

const DEFAULTS = {
  brandName: "Karin Hidayah Tour",
  brandShort: "KHT",
  categoryLabel: "Travel Umrah & Haji",
  tagline: "",
  badgeLabel: "Brand Identity Guidelines",
};

/**
 * Live brand identity (name, tagline, logo images) straight from the database.
 * Subscribes to realtime changes so header/footer always show the latest data.
 */
export function useBrandIdentity(): BrandIdentity {
  const [state, setState] = useState<BrandIdentity>({
    ...DEFAULTS,
    logoUrl: null,
    lockupUrl: null,
    logoInverseUrl: null,
    loading: true,
  });

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("brand_kit")
      .select("section,key,data,sort_order")
      .in("section", ["identity", "asset_logo"])
      .order("sort_order", { ascending: true });

    if (error || !data) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    const identity: Record<string, string> = {};
    let logoUrl: string | null = null;
    let lockupUrl: string | null = null;
    let logoInverseUrl: string | null = null;

    data.forEach((row) => {
      const d = (row.data ?? {}) as Record<string, unknown>;
      if (row.section === "identity" && row.key) {
        if (!identity[row.key]) identity[row.key] = String(d.value ?? "");
      }
      if (row.section === "asset_logo") {
        const url = typeof d.image_url === "string" && d.image_url ? d.image_url : null;
        if (!url) return;
        if (row.key === "logo_lockup") lockupUrl = url;
        else if (d.inverse === true) logoInverseUrl ??= url;
        else logoUrl ??= url;
      }
    });

    setState({
      brandName: identity.brand_name_primary || DEFAULTS.brandName,
      brandShort: identity.brand_name_secondary || DEFAULTS.brandShort,
      categoryLabel: identity.category_label || DEFAULTS.categoryLabel,
      tagline: identity.tagline || DEFAULTS.tagline,
      badgeLabel: identity.badge_label || DEFAULTS.badgeLabel,
      logoUrl,
      lockupUrl,
      logoInverseUrl,
      loading: false,
    });
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`brand_identity_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_kit" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return state;
}
