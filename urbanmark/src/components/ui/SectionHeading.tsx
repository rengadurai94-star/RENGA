import { Eyebrow } from "./Eyebrow";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  theme = "light",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  theme?: "light" | "dark";
  className?: string;
}) {
  const isDark = theme === "dark";

  return (
    <div className={cn("flex flex-col gap-5", align === "center" && "items-center text-center", className)}>
      {eyebrow ? <Eyebrow className={isDark ? "text-cream/60" : undefined}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "font-display max-w-2xl text-4xl leading-[1.1] font-medium md:text-5xl lg:text-6xl",
          isDark ? "text-cream" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-md text-base leading-relaxed md:text-lg",
            isDark ? "text-cream/60" : "text-ink/60",
            align === "center" && "max-w-xl",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
