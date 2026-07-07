import { useContext } from "react";
import { LenisContext } from "@/providers/SmoothScrollProvider";

export function useLenis() {
  return useContext(LenisContext);
}
