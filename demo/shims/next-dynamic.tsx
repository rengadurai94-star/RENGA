import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

/** next/dynamic stand-in built on React.lazy. */
export default function dynamic<P extends object>(
  loader: () => Promise<ComponentType<P> | { default: ComponentType<P> }>,
  opts: { loading?: () => ReactNode; ssr?: boolean } = {},
) {
  const Lazy = lazy(async () => {
    const mod = await loader();
    return "default" in mod ? mod : { default: mod };
  });
  return function Dynamic(props: P) {
    return (
      <Suspense fallback={opts.loading ? opts.loading() : null}>
        <Lazy {...props} />
      </Suspense>
    );
  };
}
