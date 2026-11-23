"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIES, defaultConfig, productsByCategory, PRODUCT_MAP } from "@/lib/catalog/products";
import type { CategoryId } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";
import { useConfigurator } from "@/store/configurator";
import { CabinetThumb } from "./CabinetThumb";

export function CategoryNav({ onSelect }: { onSelect?: (sku: string) => void }) {
  const sku = useConfigurator((s) => s.config.sku);
  const selectProduct = useConfigurator((s) => s.selectProduct);
  const current = PRODUCT_MAP[sku].category;
  const [expanded, setExpanded] = useState<CategoryId | null>(current);

  const pick = (s: string) => {
    selectProduct(s);
    onSelect?.(s);
  };

  return (
    <nav aria-label="Furniture categories" className="flex h-full flex-col">
      <div className="border-b border-charcoal/[0.08] px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive">Catalog</p>
        <p className="mt-1 font-display text-lg font-semibold tracking-tight">Modules</p>
      </div>
      <ul className="thin-scroll flex-1 overflow-y-auto py-2">
        {CATEGORIES.map((c) => {
          const items = productsByCategory(c.id);
          const isOpen = expanded === c.id;
          const isCurrent = current === c.id;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : c.id)}
                aria-expanded={isOpen}
                className={cn(
                  "flex w-full items-center justify-between px-5 py-2.5 text-left text-[13.5px] transition-colors hover:bg-charcoal/[0.035]",
                  isCurrent ? "font-semibold text-charcoal" : "text-charcoal/75",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span className={cn("h-1.5 w-1.5 rounded-full", isCurrent ? "bg-olive" : "bg-charcoal/15")} />
                  {c.name}
                </span>
                <span className="flex items-center gap-2 text-[11px] text-grey">
                  {items.length}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                </span>
              </button>
              {isOpen && (
                <ul className="space-y-1 px-3 pb-3 pt-1">
                  {items.map((p) => {
                    const active = p.sku === sku;
                    return (
                      <li key={p.sku}>
                        <button
                          type="button"
                          onClick={() => pick(p.sku)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-all",
                            active ? "border-charcoal bg-paper shadow-sm" : "border-transparent hover:border-charcoal/10 hover:bg-paper/70",
                          )}
                        >
                          <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-lg bg-ivory-2/70 p-1 text-charcoal/80">
                            <CabinetThumb config={defaultConfig(p)} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[12.5px] font-semibold leading-tight">{p.name}</span>
                            <span className="mt-0.5 block font-mono text-[10.5px] text-grey">{p.sku}</span>
                            <span className="block text-[10.5px] text-grey">
                              {p.width.default} × {p.height.default} × {p.depth.default}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
