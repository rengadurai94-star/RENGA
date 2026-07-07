import { PlaceholderImage } from "@/components/ui/PlaceholderImage";
import { Reveal } from "@/components/ui/Reveal";

export function ProjectGallery({ images, title }: { images: string[]; title: string }) {
  return (
    <Reveal stagger className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      {images.map((seed, index) => (
        <PlaceholderImage
          key={seed}
          seed={seed}
          label={`${title} — ${index + 1}`}
          className={index === 0 ? "aspect-[16/10] rounded-sm md:col-span-2" : "aspect-[4/5] rounded-sm"}
        />
      ))}
    </Reveal>
  );
}
