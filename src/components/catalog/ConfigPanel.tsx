"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Save, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACCESSORIES,
  BOARDS,
  CHANNELS,
  COLOUR_MAP,
  coloursForFinish,
  FINISHES,
  HANDLES,
  HINGES,
} from "@/lib/catalog/materials";
import { CATEGORY_MAP, PRODUCT_MAP } from "@/lib/catalog/products";
import type { MaterialSelection } from "@/lib/catalog/types";
import { buildCabinet, inputFromProduct } from "@/lib/geometry/cabinet";
import type { LineGroup } from "@/lib/pricing/engine";
import { formatFeetInches, fromMm, toMm, type LengthUnit } from "@/lib/units";
import { cn, formatINR } from "@/lib/utils";
import { useConfigurator } from "@/store/configurator";
import { useDesign } from "@/store/design";
import { Swatch } from "./Swatch";
import { usePricing } from "./usePricing";

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border-b border-charcoal/[0.08] px-5 py-5">
      <div className="mb-3.5 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-charcoal/55">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function DimRow({ dim, label }: { dim: "width" | "height" | "depth"; label: string }) {
  const sku = useConfigurator((s) => s.config.sku);
  const value = useConfigurator((s) => s.config[dim]);
  const unit = useConfigurator((s) => s.unit);
  const setDim = useConfigurator((s) => s.setDim);
  const range = PRODUCT_MAP[sku][dim];
  const inputUnit: LengthUnit = unit === "mm" ? "mm" : "in";
  const display = inputUnit === "mm" ? String(value) : fromMm(value, "in").toFixed(2);
  const [draft, setDraft] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const mm = Math.round(toMm(parseFloat(draft), inputUnit));
    if (!Number.isFinite(mm)) setWarn("Enter a number");
    else if (mm < range.min || mm > range.max) setWarn(`Clamped to ${range.min}–${range.max} mm`);
    else setWarn(null);
    setDim(dim, mm);
    setDraft(null);
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`dim-${dim}`} className="text-[13px] font-medium">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-grey tabular-nums">{formatFeetInches(value)}</span>
          <div className="flex h-8 items-center rounded-lg border border-charcoal/15 bg-paper focus-within:border-charcoal">
            <input
              id={`dim-${dim}`}
              inputMode="decimal"
              value={draft ?? display}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
              className="w-16 bg-transparent px-2 text-right text-[13px] font-semibold tabular-nums outline-none"
            />
            <span className="pr-2 text-[11px] text-grey">{inputUnit}</span>
          </div>
        </div>
      </div>
      <input
        type="range"
        aria-label={`${label} slider`}
        className="boxes-range mt-3 w-full"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(e) => {
          setWarn(null);
          setDim(dim, Number(e.target.value));
        }}
      />
      <div className="mt-1 flex justify-between text-[10.5px] text-grey tabular-nums">
        <span>{range.min} mm</span>
        {warn ? <span className="text-wood-2">{warn}</span> : null}
        <span>{range.max} mm</span>
      </div>
    </div>
  );
}

function OptionList<T extends { id: string }>({
  items,
  value,
  onChange,
  render,
  disabled,
  name,
}: {
  items: T[];
  value: string;
  onChange: (id: string) => void;
  render: (item: T) => { title: string; sub?: string; meta?: string };
  disabled?: boolean;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={cn("space-y-1.5", disabled && "pointer-events-none opacity-40")}>
      {items.map((it) => {
        const r = render(it);
        const active = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
              active ? "border-charcoal bg-paper" : "border-charcoal/10 hover:border-charcoal/30",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                active ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/25",
              )}
            >
              {active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{r.title}</span>
              {r.sub && <span className="block truncate text-[11px] text-grey">{r.sub}</span>}
            </span>
            {r.meta && <span className="shrink-0 text-[11px] font-medium tabular-nums text-charcoal/60">{r.meta}</span>}
          </button>
        );
      })}
    </div>
  );
}

const GROUP_LABEL: Record<LineGroup, string> = {
  materials: "Materials",
  hardware: "Hardware",
  fabrication: "Fabrication",
  labour: "Labour",
  overheads: "Overhead & margin",
  tax: "Tax",
};

export function ConfigPanel({ onOpenTray }: { onOpenTray: () => void }) {
  const config = useConfigurator((s) => s.config);
  const unit = useConfigurator((s) => s.unit);
  const setUnit = useConfigurator((s) => s.setUnit);
  const setMaterial = useConfigurator((s) => s.setMaterial);
  const product = PRODUCT_MAP[config.sku];
  const { data: price, loading, error, stale } = usePricing(config);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [name, setName] = useState("");
  const designCount = useDesign((s) => s.design.length + s.saved.length);
  const saveConfiguration = useDesign((s) => s.saveConfiguration);
  const addToDesign = useDesign((s) => s.addToDesign);

  const counts = useMemo(() => buildCabinet(inputFromProduct(product, config)).counts, [product, config]);
  const set = <K extends keyof MaterialSelection>(k: K) => (v: string) => setMaterial(k, v as MaterialSelection[K]);
  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus((s) => (s === msg ? null : s)), 2600);
  };
  const currentPrice = price && !stale ? price.total : null;

  const grouped = useMemo(() => {
    const g = new Map<LineGroup, { label: string; qty?: string; amount: number }[]>();
    price?.lines.forEach((l) => g.set(l.group, [...(g.get(l.group) ?? []), l]));
    return g;
  }, [price]);

  return (
    <div className="flex h-full flex-col">
      <div className="thin-scroll flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-charcoal/[0.08] px-5 pb-5 pt-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-olive">{CATEGORY_MAP[product.category].name}</p>
            <button
              type="button"
              onClick={onOpenTray}
              className="flex items-center gap-1.5 rounded-full border border-charcoal/15 px-3 py-1 text-[11.5px] font-medium hover:border-charcoal"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> My design
              <span className="rounded-full bg-charcoal px-1.5 text-[10px] text-ivory tabular-nums">{designCount}</span>
            </button>
          </div>
          <h2 className="mt-2 font-display text-[1.45rem] font-semibold leading-tight tracking-tight">{product.name}</h2>
          <p className="mt-1 font-mono text-[11px] text-grey">SKU {product.sku}</p>
          <p className="mt-3 text-[13px] leading-relaxed text-charcoal/65">{product.description}</p>
        </div>

        {/* Price */}
        <div className="border-b border-charcoal/[0.08] bg-paper px-5 py-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium text-grey">Price incl. 18% GST</p>
              <p className="mt-1 flex items-center gap-2 font-display text-[1.9rem] font-bold tabular-nums tracking-tight" aria-live="polite">
                {price ? formatINR(price.total) : "—"}
                {(loading || stale) && <Loader2 className="h-4 w-4 animate-spin text-grey" aria-label="Updating price" />}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              aria-expanded={showBreakdown}
              className="flex items-center gap-1 text-[12px] font-medium text-olive hover:text-charcoal"
            >
              Breakdown <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showBreakdown && "rotate-180")} />
            </button>
          </div>
          {error && <p className="mt-2 text-[12px] text-wood-2">{error}</p>}
          {price && (
            <p className="mt-2 text-[11.5px] text-grey">
              {price.quantities.boardSqm} m² board · {price.quantities.sheets} sheets · {price.quantities.edgeBandM} m edge band
            </p>
          )}
          {product.mount === "floor" && config.height <= 1000 && (
            <p className="mt-1 text-[11.5px] text-grey">Cabinet only — the countertop shown in preview is priced per run in the room designer.</p>
          )}
          {showBreakdown && price && (
            <div className="mt-4 space-y-3 text-[12px]">
              {[...grouped.entries()].map(([group, lines]) => (
                <div key={group}>
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-charcoal/45">{GROUP_LABEL[group]}</p>
                  {lines.map((l) => (
                    <div key={l.label} className="flex justify-between gap-3 py-0.5">
                      <span className="text-charcoal/75">
                        {l.label}
                        {l.qty && <span className="text-grey"> · {l.qty}</span>}
                      </span>
                      <span className="shrink-0 tabular-nums">{formatINR(l.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="flex justify-between border-t border-charcoal/10 pt-2 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(price.total)}</span>
              </div>
            </div>
          )}
        </div>

        <Section
          title="Dimensions"
          aside={
            <div className="flex rounded-full border border-charcoal/10 p-0.5 text-[11px]" role="radiogroup" aria-label="Units">
              {(["mm", "in", "ft"] as LengthUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={unit === u}
                  onClick={() => setUnit(u)}
                  className={cn("rounded-full px-2.5 py-0.5 font-medium", unit === u ? "bg-charcoal text-ivory" : "text-charcoal/60")}
                >
                  {u === "ft" ? "ft-in" : u}
                </button>
              ))}
            </div>
          }
        >
          <DimRow dim="width" label="Width" />
          <DimRow dim="height" label="Height" />
          <DimRow dim="depth" label="Depth" />
        </Section>

        <Section title="Carcass material">
          <OptionList
            name="Carcass material"
            items={BOARDS.filter((b) => b.usableFor.includes("carcass"))}
            value={config.carcass}
            onChange={set("carcass")}
            render={(b) => ({ title: b.name, sub: b.grade, meta: `₹${b.ratePerSqm}/m²` })}
          />
        </Section>

        <Section title="Shutter material">
          <OptionList
            name="Shutter material"
            items={BOARDS.filter((b) => b.usableFor.includes("shutter"))}
            value={config.shutter}
            onChange={set("shutter")}
            disabled={counts.fronts === 0}
            render={(b) => ({ title: b.name, sub: b.grade, meta: `₹${b.ratePerSqm}/m²` })}
          />
          {counts.fronts === 0 && <p className="mt-2 text-[11.5px] text-grey">Open unit — no shutters.</p>}
        </Section>

        <Section title="Finish">
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Finish">
            {FINISHES.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={config.finish === f.id}
                onClick={() => setMaterial("finish", f.id)}
                title={f.description}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left transition-colors",
                  config.finish === f.id ? "border-charcoal bg-paper" : "border-charcoal/10 hover:border-charcoal/30",
                )}
              >
                <span className="block text-[12.5px] font-medium leading-tight">{f.name}</span>
                <span className="text-[10.5px] text-grey">₹{f.ratePerSqm}/m²</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Colour" aside={<span className="text-[11.5px] text-charcoal/70">{COLOUR_MAP[config.colour]?.name}</span>}>
          <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Colour">
            {coloursForFinish(config.finish).map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={config.colour === c.id}
                aria-label={`${c.name} ${c.code}`}
                title={`${c.name} · ${c.code}${c.premiumPerSqm ? ` · +₹${c.premiumPerSqm}/m²` : ""}`}
                onClick={() => setMaterial("colour", c.id)}
                className={cn(
                  "aspect-square overflow-hidden rounded-lg border border-charcoal/10 transition-transform",
                  config.colour === c.id ? "ring-2 ring-charcoal ring-offset-2 ring-offset-ivory" : "hover:scale-105",
                )}
              >
                <Swatch colour={c} className="h-full w-full" />
              </button>
            ))}
          </div>
        </Section>

        <Section title="Handles">
          <OptionList
            name="Handles"
            items={HANDLES}
            value={config.handle}
            onChange={set("handle")}
            disabled={counts.fronts === 0}
            render={(h) => ({ title: h.name, meta: `₹${h.price}` })}
          />
        </Section>

        <Section title="Hinges">
          <OptionList
            name="Hinges"
            items={HINGES}
            value={config.hinge}
            onChange={set("hinge")}
            disabled={counts.hinges === 0}
            render={(h) => ({ title: h.name, sub: h.description, meta: `₹${h.price}` })}
          />
          <p className="mt-2 text-[11.5px] text-grey">
            {counts.hinges === 0 ? "No hinged fronts in this unit." : `${counts.hinges} hinges in this configuration.`}
          </p>
        </Section>

        <Section title="Drawer channels">
          <OptionList
            name="Drawer channels"
            items={CHANNELS}
            value={config.channel}
            onChange={set("channel")}
            disabled={counts.channels === 0}
            render={(c) => ({ title: c.name, sub: c.description, meta: `₹${c.price}` })}
          />
          <p className="mt-2 text-[11.5px] text-grey">
            {counts.channels === 0 ? "No drawers in this unit." : `${counts.channels} drawer sets in this configuration.`}
          </p>
        </Section>

        <Section title="Included">
          <ul className="space-y-1.5 text-[12.5px] text-charcoal/75">
            {product.features.map((f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-olive" /> {f}
              </li>
            ))}
            {(product.accessories ?? []).map((a, i) => (
              <li key={`${a}-${i}`} className="flex gap-2">
                <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-olive" /> {ACCESSORIES[a]?.name}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Actions */}
      <div className="border-t border-charcoal/10 bg-ivory/95 px-5 py-4 backdrop-blur">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Name this configuration (e.g. ${product.name})`}
          aria-label="Configuration name"
          className="mb-3 h-9 w-full rounded-lg border border-charcoal/15 bg-paper px-3 text-[13px] outline-none focus:border-charcoal"
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const item = saveConfiguration(name.trim() || product.name, config, currentPrice);
              setName("");
              flash(`Saved “${item.name}”`);
            }}
          >
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button
            onClick={() => {
              addToDesign(config, currentPrice);
              flash("Added to your design");
            }}
          >
            <Plus className="h-4 w-4" /> Add to design
          </Button>
        </div>
        <p className="mt-2 h-4 text-center text-[11.5px] text-olive" role="status" aria-live="polite">
          {status}
        </p>
      </div>
    </div>
  );
}
