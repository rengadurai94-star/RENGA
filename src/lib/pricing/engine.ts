/**
 * BOXES pricing engine.
 *
 * Prices a cabinet by measuring its parametric geometry: every board panel's
 * face area, every running metre of edge band, every hinge, runner and handle.
 * Rates live in PRICING_RULES (to be admin-managed). Runs on the server via
 * /api/pricing; it is pure so it is also unit-testable.
 */
import {
  ACCESSORIES,
  BOARD_MAP,
  CHANNEL_MAP,
  COLOUR_MAP,
  FINISH_MAP,
  HANDLE_MAP,
  HINGE_MAP,
} from "@/lib/catalog/materials";
import { PRODUCT_MAP } from "@/lib/catalog/products";
import type { CabinetConfig } from "@/lib/catalog/types";
import { buildCabinet, inputFromProduct, type Part } from "@/lib/geometry/cabinet";

export const PRICING_RULES = {
  sheetSqm: 2.44 * 1.22,
  backPanelPerSqm: 420, // 6mm back board
  drawerBoxFactor: 0.75, // 12mm drawer boxes vs 18mm carcass rate
  innerLinerPerSqm: 180, // balancing laminate on the inside of shutters
  carcassEdgeBandPerM: 18,
  fabricationPerSqm: 185, // CNC cutting, drilling, edge-banding machine time
  labourPerCabinet: 650, // assembly
  labourPerFront: 120, // fitting & aligning each door/drawer
  installationFloor: 450,
  installationWall: 550,
  legsPerFloorUnit: 4,
  legPrice: 55,
  plinthPerM: 380,
  wallHangerPair: 280,
  wastagePct: 0.12,
  overheadPct: 0.1,
  marginPct: 0.22,
  gstPct: 0.18,
} as const;

export type LineGroup = "materials" | "hardware" | "fabrication" | "labour" | "overheads" | "tax";

export interface PriceLine {
  key: string;
  label: string;
  group: LineGroup;
  qty?: string;
  amount: number;
}

export interface PriceQuantities {
  carcassSqm: number;
  backSqm: number;
  frontSqm: number;
  drawerBoxSqm: number;
  boardSqm: number;
  sheets: number;
  edgeBandM: number;
  hinges: number;
  channels: number;
  handles: number;
  fronts: number;
}

export interface PriceResult {
  sku: string;
  configCode: string;
  lines: PriceLine[];
  quantities: PriceQuantities;
  cost: number;
  overhead: number;
  margin: number;
  preTax: number;
  gst: number;
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const pad = (n: number) => String(Math.round(n)).padStart(4, "0");

/** Face area of a panel (m²) — the two largest extents. */
export function panelSqm(p: Part) {
  const [a, b] = [...p.size].sort((x, y) => y - x);
  return (a * b) / 1e6;
}

export function configCode(c: CabinetConfig) {
  const colour = COLOUR_MAP[c.colour];
  return `${c.sku}-${pad(c.width)}x${pad(c.height)}x${pad(c.depth)}-${colour?.code ?? "XX"}`;
}

export function priceCabinet(config: CabinetConfig): PriceResult {
  const R = PRICING_RULES;
  const product = PRODUCT_MAP[config.sku];
  if (!product) throw new Error(`Unknown SKU ${config.sku}`);
  const carcass = BOARD_MAP[config.carcass];
  const shutter = BOARD_MAP[config.shutter];
  const finish = FINISH_MAP[config.finish];
  const colour = COLOUR_MAP[config.colour];
  const handle = HANDLE_MAP[config.handle];
  const hinge = HINGE_MAP[config.hinge];
  const channel = CHANNEL_MAP[config.channel];
  if (!carcass || !shutter || !finish || !colour || !handle || !hinge || !channel) {
    throw new Error("Unknown material or hardware id");
  }

  const geo = buildCabinet(inputFromProduct(product, config, handle));
  const allParts = [...geo.parts, ...geo.fronts.flatMap((f) => f.parts)];

  let carcassSqm = 0;
  let backSqm = 0;
  let frontSqm = 0;
  let drawerBoxSqm = 0;
  let carcassEdgeMm = 0;
  let frontEdgeMm = 0;
  for (const p of allParts) {
    if (p.surface === "carcass") {
      carcassSqm += panelSqm(p);
      carcassEdgeMm += p.edgeMm ?? 0;
    } else if (p.surface === "back") backSqm += panelSqm(p);
    else if (p.surface === "drawerbox") drawerBoxSqm += panelSqm(p);
    else if (p.surface === "front") {
      frontSqm += panelSqm(p);
      frontEdgeMm += p.edgeMm ?? 0;
    }
  }
  // Exposed outer faces of the side panels get the finish too on open shelves.
  const exposedSides = product.category === "open-shelf";

  const lines: PriceLine[] = [];
  const add = (key: string, label: string, group: LineGroup, amount: number, qty?: string) => {
    if (amount > 0) lines.push({ key, label, group, amount: round2(amount), qty });
  };

  /* Materials */
  const carcassCost = carcassSqm * carcass.ratePerSqm;
  const backCost = backSqm * R.backPanelPerSqm;
  const drawerCost = drawerBoxSqm * carcass.ratePerSqm * R.drawerBoxFactor;
  const shutterCost = frontSqm * shutter.ratePerSqm;
  const finishSqm = frontSqm + (exposedSides ? (2 * config.height * config.depth) / 1e6 : 0);
  const finishCost = finishSqm * (finish.ratePerSqm + (colour.premiumPerSqm ?? 0));
  const linerCost = frontSqm * R.innerLinerPerSqm;
  const edgeBandM = (carcassEdgeMm + frontEdgeMm) / 1000;
  const edgeCost = (carcassEdgeMm / 1000) * R.carcassEdgeBandPerM + (frontEdgeMm / 1000) * finish.edgeBandPerM;

  add("carcass", `Carcass · ${carcass.name}`, "materials", carcassCost, `${carcassSqm.toFixed(2)} m²`);
  add("back", "Back panel · 6mm", "materials", backCost, `${backSqm.toFixed(2)} m²`);
  add("drawer-box", "Drawer boxes · 12mm", "materials", drawerCost, `${drawerBoxSqm.toFixed(2)} m²`);
  add("shutter", `Shutter board · ${shutter.name}`, "materials", shutterCost, `${frontSqm.toFixed(2)} m²`);
  add("finish", `${finish.name} · ${colour.name}`, "materials", finishCost, `${finishSqm.toFixed(2)} m²`);
  add("liner", "Inner balancing liner", "materials", linerCost, `${frontSqm.toFixed(2)} m²`);
  add("edge", "Edge banding", "materials", edgeCost, `${edgeBandM.toFixed(1)} m`);

  const boardMaterials = carcassCost + backCost + drawerCost + shutterCost + finishCost + linerCost + edgeCost;

  /* Hardware */
  const handles = geo.counts.fronts;
  add("hinges", `Hinges · ${hinge.name}`, "hardware", geo.counts.hinges * hinge.price, `${geo.counts.hinges} pcs`);
  add("channels", `Runners · ${channel.name}`, "hardware", geo.counts.channels * channel.price, `${geo.counts.channels} sets`);
  add("handles", handle.style === "none" ? "Push-to-open latches" : `Handles · ${handle.name}`, "hardware", handles * handle.price, `${handles} pcs`);
  for (const id of product.accessories ?? []) {
    const acc = ACCESSORIES[id];
    if (acc) add(`acc-${id}-${lines.length}`, acc.name, "hardware", acc.price, "1 set");
  }
  if (product.mount === "floor" && product.plinthMm > 0) {
    add("legs", "Adjustable legs", "hardware", R.legsPerFloorUnit * R.legPrice, `${R.legsPerFloorUnit} pcs`);
    add("plinth", "Plinth / skirting", "hardware", (config.width / 1000) * R.plinthPerM, `${(config.width / 1000).toFixed(2)} m`);
  } else if (product.mount !== "floor") {
    add("hangers", "Concealed wall hangers", "hardware", R.wallHangerPair, "1 pair");
  }

  /* Fabrication & labour */
  const boardSqm = carcassSqm + backSqm + frontSqm + drawerBoxSqm;
  add("fabrication", "CNC cutting, drilling & edge-banding", "fabrication", boardSqm * R.fabricationPerSqm, `${boardSqm.toFixed(2)} m²`);
  add("assembly", "Assembly & front alignment", "labour", R.labourPerCabinet + geo.counts.fronts * R.labourPerFront, `${geo.counts.fronts} fronts`);
  add("install", "Site installation", "labour", product.mount === "floor" ? R.installationFloor : R.installationWall, "1 unit");

  /* Wastage on cut materials */
  add("wastage", `Wastage allowance · ${Math.round(R.wastagePct * 100)}%`, "materials", boardMaterials * R.wastagePct);

  const cost = lines.reduce((s, l) => s + l.amount, 0);
  const overhead = round2(cost * R.overheadPct);
  const margin = round2((cost + overhead) * R.marginPct);
  const preTax = round2(cost + overhead + margin);
  const gst = round2(preTax * R.gstPct);
  const total = Math.round(preTax + gst);

  lines.push({ key: "overhead", label: `Overhead · ${Math.round(R.overheadPct * 100)}%`, group: "overheads", amount: overhead });
  lines.push({ key: "margin", label: `Margin · ${Math.round(R.marginPct * 100)}%`, group: "overheads", amount: margin });
  lines.push({ key: "gst", label: `GST · ${Math.round(R.gstPct * 100)}%`, group: "tax", amount: gst });

  return {
    sku: config.sku,
    configCode: configCode(config),
    lines,
    quantities: {
      carcassSqm: round2(carcassSqm),
      backSqm: round2(backSqm),
      frontSqm: round2(frontSqm),
      drawerBoxSqm: round2(drawerBoxSqm),
      boardSqm: round2(boardSqm),
      sheets: round2((boardSqm * (1 + R.wastagePct)) / R.sheetSqm),
      edgeBandM: round2(edgeBandM),
      hinges: geo.counts.hinges,
      channels: geo.counts.channels,
      handles,
      fronts: geo.counts.fronts,
    },
    cost: round2(cost),
    overhead,
    margin,
    preTax,
    gst,
    total,
  };
}
