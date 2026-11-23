import { project } from "@/config/project";

export default function SiteFooter() {
  return (
    <footer className="relative bg-ink px-6 pb-10 pt-24 text-paper/80 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="font-sans text-[16vw] font-extralight leading-none tracking-[0.08em] text-paper md:text-[9rem]">{project.name}</p>
            <p className="mt-4 text-[11px] uppercase tracking-label text-paper/50">
              {project.location.area} · {project.location.city} · {project.location.state}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-label text-paper/40">RERA</dt>
              <dd className="italic text-paper/60">{project.rera}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-label text-paper/40">Developer</dt>
              <dd className="italic text-paper/60">{project.developer.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-label text-paper/40">Phone</dt>
              <dd>{project.contact.phone}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-label text-paper/40">Email</dt>
              <dd>{project.contact.email}</dd>
            </div>
          </dl>
        </div>
        <p className="mt-16 max-w-4xl border-t border-paper/10 pt-8 text-[11px] leading-relaxed text-paper/45">{project.disclaimer}</p>
        <p className="mt-4 text-[11px] text-paper/35">
          © {new Date().getFullYear()} {project.name}. Interactive prototype — 3D geometry is procedurally generated.
        </p>
      </div>
    </footer>
  );
}
