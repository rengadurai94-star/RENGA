import { Eyebrow } from "./Eyebrow";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-5", align === "center" && "items-center text-center", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="font-display max-w-2xl text-4xl leading-[1.1] font-medium text-ink md:text-5xl lg:text-6xl">
        {title}
      </h2>
      {description ? (
        <p className={cn("max-w-md text-base leading-relaxed text-ink/60 md:text-lg", align === "center" && "max-w-xl")}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
