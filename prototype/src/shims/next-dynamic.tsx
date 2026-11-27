import { createElement, lazy, Suspense, type ComponentType } from "react";

type Loader<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>;

/** Prototype stand-in for next/dynamic: React.lazy + Suspense with the given loading view. */
export default function dynamic<P extends object>(
  loader: Loader<P>,
  options?: { loading?: ComponentType; ssr?: boolean }
): ComponentType<P> {
  const Lazy = lazy(async () => {
    const mod = await loader();
    return { default: "default" in mod ? mod.default : mod };
  });
  function Dynamic(props: P) {
    return createElement(
      Suspense,
      { fallback: options?.loading ? createElement(options.loading) : null },
      createElement(Lazy as ComponentType<P>, props)
    );
  }
  return Dynamic;
}
