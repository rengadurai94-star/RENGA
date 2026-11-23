"use client";

import { useEffect, useState } from "react";
import type { CabinetConfig } from "@/lib/catalog/types";
import type { PriceResult } from "@/lib/pricing/engine";
import { fetchPrices } from "@/lib/pricing/client";

/** Debounced server-side price for one configuration. */
export function usePricing(config: CabinetConfig) {
  const [state, setState] = useState<{ data: PriceResult | null; loading: boolean; error: string | null; key: string }>({
    data: null,
    loading: true,
    error: null,
    key: "",
  });
  const key = JSON.stringify(config);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setState((s) => ({ ...s, loading: true }));
      fetchPrices([JSON.parse(key)], ctrl.signal)
        .then((r) => setState({ data: r.items[0], loading: false, error: null, key }))
        .catch((e: Error) => {
          if (e.name !== "AbortError") setState((s) => ({ ...s, loading: false, error: e.message, key }));
        });
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [key]);

  return { ...state, stale: state.key !== key };
}
