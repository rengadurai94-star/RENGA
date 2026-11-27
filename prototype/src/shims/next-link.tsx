import type { AnchorHTMLAttributes, ReactNode } from "react";
import { toHash } from "../routes";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
};

/** Prototype stand-in for next/link: site paths become hash routes. */
export default function Link({ href, children, prefetch, replace, scroll, ...rest }: Props) {
  void prefetch;
  void replace;
  void scroll;
  return (
    <a href={toHash(href)} {...rest}>
      {children}
    </a>
  );
}
