"use client";

import { SmoothScrollProvider } from "./SmoothScrollProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
