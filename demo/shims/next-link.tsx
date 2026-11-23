import { forwardRef, type AnchorHTMLAttributes } from "react";
import { hrefToHash } from "../router";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

/** next/link stand-in: rewrites app paths to demo hash routes. */
const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, ...rest }, ref) {
  return <a ref={ref} href={hrefToHash(href)} {...rest} />;
});
export default Link;
