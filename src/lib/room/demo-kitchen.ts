import { PRODUCT_MAP } from "@/lib/catalog/products";
import type { CabinetConfig, MaterialSelection } from "@/lib/catalog/types";
import type { Placement, Room, WallId } from "./layout";

/** A 12' × 10' L-shaped demo kitchen used on the landing page. */
export const DEMO_ROOM: Room = { width: 3600, length: 3000, height: 2700 };

const BASE: Partial<MaterialSelection> = { colour: "olive" };
const UPPER: Partial<MaterialSelection> = { colour: "ivory" };
const TALL: Partial<MaterialSelection> = { finish: "lam-texture", colour: "oak", handle: "bar-black" };

function place(
  id: string,
  wall: WallId,
  offset: number,
  sku: string,
  dims: Partial<Pick<CabinetConfig, "width" | "height" | "depth">>,
  materials: Partial<MaterialSelection> = {},
  elevation?: number,
): Placement {
  const p = PRODUCT_MAP[sku];
  if (!p) throw new Error(`Unknown SKU ${sku}`);
  const config: CabinetConfig = {
    sku,
    width: dims.width ?? p.width.default,
    height: dims.height ?? p.height.default,
    depth: dims.depth ?? p.depth.default,
    ...p.defaults,
    handle: "gprofile-alu",
    ...materials,
  };
  return { id, wall, offset, elevation: elevation ?? p.defaultElevationMm, config };
}

export const DEMO_PLACEMENTS: Placement[] = [
  // Wall A — base run
  place("a-tall", "A", 0, "BX-TL-APP", { width: 600 }, TALL),
  place("a-drawer", "A", 600, "BX-DR-3", { width: 600 }, BASE),
  place("a-sink", "A", 1200, "BX-SK-2D", { width: 900 }, BASE),
  place("a-dd", "A", 2100, "BX-KB-DD", { width: 600 }, BASE),
  place("a-1d", "A", 2700, "BX-KB-1D", { width: 300 }, BASE),
  // Wall A — wall units
  place("aw-1", "A", 600, "BX-KW-2D", { width: 600 }, UPPER),
  place("aw-2", "A", 1200, "BX-KW-2D", { width: 900 }, UPPER),
  place("aw-3", "A", 2100, "BX-KW-1D", { width: 600 }, UPPER),
  place("aw-4", "A", 2700, "BX-KW-1D", { width: 550 }, UPPER),
  // Wall A — lofts
  place("al-1", "A", 0, "BX-LF-2D", { width: 600, depth: 580 }, TALL),
  place("al-2", "A", 600, "BX-LF-2D", { width: 1200 }, UPPER),
  place("al-3", "A", 1800, "BX-LF-2D", { width: 1200 }, UPPER),
  place("al-4", "A", 3000, "BX-LF-2D", { width: 600 }, UPPER),
  // Wall B — base run
  place("b-corner", "B", 0, "BX-CN-BLD", { width: 1000 }, BASE),
  place("b-hob", "B", 1000, "BX-KB-HOB", { width: 900 }, BASE),
  place("b-drawer", "B", 1900, "BX-DR-4", { width: 600 }, BASE),
  // Wall B — upper
  place("bw-corner", "B", 0, "BX-CN-WAL", { width: 800 }, UPPER),
  place("bw-1", "B", 1900, "BX-KW-2D", { width: 600 }, UPPER),
  place("bl-1", "B", 1900, "BX-LF-2D", { width: 600 }, UPPER),
];

/** Hob position on wall B, used to place the chimney hood. */
export const DEMO_HOOD = { wall: "B" as WallId, offset: 1000, width: 900 };
