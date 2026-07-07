import { SITE } from "@/lib/constants";

const tiles = [
  { label: "WhatsApp", value: "Message us directly", href: SITE.whatsapp },
  { label: "Phone", value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
];

export function QuickContact() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {tiles.map((tile) => (
        <a
          key={tile.label}
          href={tile.href}
          target={tile.label === "WhatsApp" ? "_blank" : undefined}
          rel={tile.label === "WhatsApp" ? "noreferrer" : undefined}
          data-cursor="hover"
          className="group flex flex-col gap-2 rounded-sm border border-ink/10 p-6 transition-colors hover:border-brass"
        >
          <span className="text-xs tracking-[0.2em] text-ink/40 uppercase">{tile.label}</span>
          <span className="font-display text-lg text-ink group-hover:text-brass">{tile.value}</span>
        </a>
      ))}
    </div>
  );
}
