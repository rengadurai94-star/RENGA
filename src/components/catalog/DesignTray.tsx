"use client";

import { useEffect } from "react";
import { Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLOUR_MAP } from "@/lib/catalog/materials";
import { PRODUCT_MAP } from "@/lib/catalog/products";
import { configCode } from "@/lib/pricing/engine";
import { cn, formatINR } from "@/lib/utils";
import { useConfigurator } from "@/store/configurator";
import { useDesign } from "@/store/design";
import { CabinetThumb } from "./CabinetThumb";

export function DesignTray({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { saved, design, removeSaved, removeFromDesign, clearDesign } = useDesign();
  const loadConfig = useConfigurator((s) => s.loadConfig);
  const designTotal = design.reduce((s, d) => s + (d.price ?? 0), 0);
  const unpriced = design.some((d) => d.price === null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={cn("fixed inset-0 z-[60] transition-opacity", open ? "opacity-100" : "pointer-events-none opacity-0")} aria-hidden={!open}>
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="My design"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-500 ease-[var(--ease-arch)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive">Workspace</p>
            <h2 className="font-display text-xl font-semibold tracking-tight">My design</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-charcoal/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto">
          <section className="px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/55">Design · {design.length} modules</h3>
              {design.length > 0 && (
                <button type="button" onClick={clearDesign} className="text-[11.5px] text-grey hover:text-charcoal">
                  Clear
                </button>
              )}
            </div>
            {design.length === 0 ? (
              <p className="rounded-xl border border-dashed border-charcoal/15 p-5 text-center text-[13px] text-grey">
                Modules you add to your design appear here, ready to place in the room designer.
              </p>
            ) : (
              <ul className="space-y-2">
                {design.map((d) => (
                  <Row key={d.id} config={d.config} title={PRODUCT_MAP[d.config.sku]?.name} price={d.price}>
                    <IconBtn label="Load into configurator" onClick={() => (loadConfig(d.config), onClose())}>
                      <Upload className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn label="Remove" onClick={() => removeFromDesign(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </Row>
                ))}
              </ul>
            )}
            {design.length > 0 && (
              <div className="mt-4 flex items-end justify-between rounded-xl bg-paper p-4">
                <span className="text-[12px] text-grey">Design total incl. GST{unpriced ? " (some items unpriced)" : ""}</span>
                <span className="font-display text-xl font-bold tabular-nums">{formatINR(designTotal)}</span>
              </div>
            )}
          </section>

          <section className="border-t border-charcoal/10 px-5 py-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/55">Saved configurations · {saved.length}</h3>
            {saved.length === 0 ? (
              <p className="text-[13px] text-grey">Nothing saved yet.</p>
            ) : (
              <ul className="space-y-2">
                {saved.map((s) => (
                  <Row key={s.id} config={s.config} title={s.name} price={s.price}>
                    <IconBtn label="Load into configurator" onClick={() => (loadConfig(s.config), onClose())}>
                      <Upload className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn label="Delete" onClick={() => removeSaved(s.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </Row>
                ))}
              </ul>
            )}
          </section>
        </div>
        <div className="border-t border-charcoal/10 px-5 py-4 text-[11.5px] leading-relaxed text-grey">
          Saved on this device. Customer accounts will sync designs, quotations and orders across devices.
          <Button className="mt-3 w-full" variant="secondary" onClick={onClose}>
            Continue configuring
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Row({
  config,
  title,
  price,
  children,
}: {
  config: Parameters<typeof configCode>[0];
  title?: string;
  price: number | null;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-paper p-2.5">
      <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-ivory-2/70 p-1 text-charcoal/80">
        <CabinetThumb config={config} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{title}</span>
        <span className="block truncate font-mono text-[10.5px] text-grey">{configCode(config)}</span>
        <span className="text-[11px] text-charcoal/60">
          {COLOUR_MAP[config.colour]?.name} · {price !== null ? formatINR(price) : "price pending"}
        </span>
      </span>
      <span className="flex gap-0.5">{children}</span>
    </li>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className="flex h-8 w-8 items-center justify-center rounded-full text-charcoal/60 hover:bg-charcoal/5 hover:text-charcoal">
      {children}
    </button>
  );
}
