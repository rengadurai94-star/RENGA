"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { PRODUCT_MAP } from "@/lib/catalog/products";
import { useConfigurator } from "@/store/configurator";
import { useDesign } from "@/store/design";
import { CategoryNav } from "./CategoryNav";
import { ConfigPanel } from "./ConfigPanel";
import { DesignTray } from "./DesignTray";

const Viewport = dynamic(() => import("./Viewport"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#efeae0] text-[12px] text-grey">Loading 3D viewport…</div>
  ),
});

export function CatalogApp({ initialSku }: { initialSku?: string }) {
  const [trayOpen, setTrayOpen] = useState(false);
  const sku = useConfigurator((s) => s.config.sku);

  // Apply a deep-linked SKU once, and restore the saved design from this device.
  useEffect(() => {
    if (initialSku && PRODUCT_MAP[initialSku]) useConfigurator.getState().selectProduct(initialSku);
    useDesign.persist.rehydrate();
  }, [initialSku]);

  // Keep the URL shareable without triggering navigation.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("sku") !== sku) {
        url.searchParams.set("sku", sku);
        window.history.replaceState(null, "", url);
      }
    } catch {
      // Sandboxed hosts (e.g. the standalone demo) may forbid URL changes.
    }
  }, [sku]);

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] lg:h-[calc(100svh-4rem)] lg:grid-cols-[272px_minmax(0,1fr)_392px] xl:grid-cols-[296px_minmax(0,1fr)_420px]">
        <aside className="hidden border-r border-charcoal/[0.08] bg-ivory lg:block lg:min-h-0">
          <CategoryNav />
        </aside>
        <MobileCategoryBar />
        <section aria-label="3D viewport" className="h-[56svh] min-h-[360px] lg:h-auto lg:min-h-0">
          <Viewport />
        </section>
        <aside aria-label="Product details and customisation" className="border-l border-charcoal/[0.08] bg-ivory lg:min-h-0">
          <ConfigPanel onOpenTray={() => setTrayOpen(true)} />
        </aside>
      </div>
      <DesignTray open={trayOpen} onClose={() => setTrayOpen(false)} />
    </>
  );
}

/** Below lg the category tree collapses into a disclosure above the viewport. */
function MobileCategoryBar() {
  const [open, setOpen] = useState(false);
  const sku = useConfigurator((s) => s.config.sku);
  const p = PRODUCT_MAP[sku];
  return (
    <div className="border-b border-charcoal/[0.08] bg-ivory lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span>
          <span className="block text-[10.5px] font-semibold uppercase tracking-[0.2em] text-olive">Browse modules</span>
          <span className="text-[14px] font-semibold">{p.name}</span>
        </span>
        <span className="rounded-full border border-charcoal/15 px-3 py-1 text-[12px] font-medium">{open ? "Close" : "Change"}</span>
      </button>
      {open && (
        <div className="max-h-[60svh] overflow-y-auto border-t border-charcoal/[0.08]">
          <CategoryNav onSelect={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
