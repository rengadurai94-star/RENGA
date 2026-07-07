import { cn } from "@/lib/utils";

type ContainerTag = "div" | "section" | "header" | "footer" | "article" | "main" | "nav";

export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ContainerTag;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-[1400px] px-6 md:px-10 xl:px-16", className)}>
      {children}
    </Tag>
  );
}
