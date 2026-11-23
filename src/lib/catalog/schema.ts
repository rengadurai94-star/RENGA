import { z } from "zod";
import { BOARD_MAP, CHANNEL_MAP, COLOUR_MAP, FINISH_MAP, HANDLE_MAP, HINGE_MAP } from "./materials";
import { PRODUCT_MAP } from "./products";

/** Validates a cabinet configuration against the live catalog. */
export const CabinetConfigSchema = z
  .object({
    sku: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    depth: z.number().int().positive(),
    carcass: z.string(),
    shutter: z.string(),
    finish: z.string(),
    colour: z.string(),
    handle: z.string(),
    hinge: z.string(),
    channel: z.string(),
  })
  .superRefine((c, ctx) => {
    const p = PRODUCT_MAP[c.sku];
    if (!p) {
      ctx.addIssue({ code: "custom", path: ["sku"], message: `Unknown SKU ${c.sku}` });
      return;
    }
    for (const dim of ["width", "height", "depth"] as const) {
      const r = p[dim];
      if (c[dim] < r.min || c[dim] > r.max) {
        ctx.addIssue({ code: "custom", path: [dim], message: `${dim} must be between ${r.min} and ${r.max} mm` });
      }
    }
    const carcass = BOARD_MAP[c.carcass];
    if (!carcass?.usableFor.includes("carcass")) ctx.addIssue({ code: "custom", path: ["carcass"], message: "Invalid carcass board" });
    const shutter = BOARD_MAP[c.shutter];
    if (!shutter?.usableFor.includes("shutter")) ctx.addIssue({ code: "custom", path: ["shutter"], message: "Invalid shutter board" });
    if (!FINISH_MAP[c.finish]) ctx.addIssue({ code: "custom", path: ["finish"], message: "Invalid finish" });
    const colour = COLOUR_MAP[c.colour];
    if (!colour) ctx.addIssue({ code: "custom", path: ["colour"], message: "Invalid colour" });
    else if (!colour.finishes.includes(c.finish))
      ctx.addIssue({ code: "custom", path: ["colour"], message: `${colour.name} is not available in this finish` });
    if (!HANDLE_MAP[c.handle]) ctx.addIssue({ code: "custom", path: ["handle"], message: "Invalid handle" });
    if (!HINGE_MAP[c.hinge]) ctx.addIssue({ code: "custom", path: ["hinge"], message: "Invalid hinge" });
    if (!CHANNEL_MAP[c.channel]) ctx.addIssue({ code: "custom", path: ["channel"], message: "Invalid channel" });
  });

export const PricingRequestSchema = z.object({
  configs: z.array(CabinetConfigSchema).min(1).max(200),
});
