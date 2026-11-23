import type { Metadata } from "next";
import { CatalogApp } from "@/components/catalog/CatalogApp";

export const metadata: Metadata = {
  title: "3D Catalog",
  description: "Browse BOXES modular cabinets in 3D and configure size, materials, finish and hardware with live pricing.",
};

export default async function CatalogPage({ searchParams }: PageProps<"/3d-catalog">) {
  const { sku } = await searchParams;
  return (
    <main>
      <h1 className="sr-only">BOXES 3D Catalog</h1>
      <CatalogApp initialSku={typeof sku === "string" ? sku : undefined} />
    </main>
  );
}
