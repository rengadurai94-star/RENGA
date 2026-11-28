import {
  BatteryCharging,
  BookOpen,
  Briefcase,
  Building,
  Cctv,
  Dumbbell,
  Flame,
  Flower2,
  Gamepad2,
  KeyRound,
  Lamp,
  LockKeyhole,
  type LucideIcon,
  PlugZap,
  ShieldCheck,
  Smile,
  Sofa,
  Sprout,
  Sun,
  UtensilsCrossed,
  Waves,
} from 'lucide-react';
import { data, mediaInfo } from '../data/project';
import { openLightbox } from './Lightbox';
import { Img, Reveal } from './ui';

const ICONS: Record<string, LucideIcon> = {
  'Management Office': Briefcase,
  'Access Card Controlled Lift & Car Park': KeyRound,
  'Security & Cabin': ShieldCheck,
  'CCTV Cameras': Cctv,
  'Private Lobby': Sofa,
  'Co-working / Study Room': Lamp,
  Library: BookOpen,
  'Games Corner': Gamepad2,
  Gym: Dumbbell,
  Garden: Flower2,
  Playground: Smile,
  'BBQ Area': UtensilsCrossed,
  'Roof Top Lounge': Sun,
  'Terrace Garden Lounge': Sprout,
  'Outdoor Yoga Lawn': Sprout,
  'Smart Main Door Lock': LockKeyhole,
  'Centralized Gas Pipeline': Flame,
  'Water Softener': Waves,
  'Power Backup Generator': BatteryCharging,
  'EV Charging Bay Provisions': PlugZap,
  'False Ceiling': Building,
};

export default function Amenities() {
  // Amenity images (brochure pp.11-12): every amenity that has an image, plus the second gym view.
  const withImages = data.amenityGroups.flatMap((g) => g.items).filter((a) => a.image);
  const extraGym = { name: 'Gym', image: 'media/amenities/gym-strength', caption: 'A dedicated fitness space for daily workouts', where: 'Terrace', planRef: 11 };
  const lead = ['Roof Top Lounge', 'Private Lobby'];
  const featured = [
    ...lead.map((n) => withImages.find((a) => a.name === n)).filter((a): a is NonNullable<typeof a> => !!a),
    ...withImages.filter((a) => !lead.includes(a.name)),
    extraGym,
  ];
  const lb = featured.map((a) => ({ src: a.image!, caption: a.name, note: a.caption ? `"${a.caption}" · brochure pp.11–12` : 'Brochure pp.11–12' }));
  const total = data.amenityGroups.reduce((n, g) => n + g.items.length, 0);
  const plans = [
    { key: 'stilt', title: 'Stilt Floor', img: 'media/plans/stilt-floor-3d', legend: data.planLegends.stilt, page: 10 },
    { key: 'terrace', title: 'Terrace Floor', img: 'media/plans/terrace-floor-3d', legend: data.planLegends.terrace, page: 13 },
  ];

  return (
    <section className="section paper" id="amenities" aria-labelledby="amenities-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Amenities</p>
            <h2 id="amenities-title" className="display h2">
              {total} amenities, <em>thoughtfully</em> planned.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">Secure access, functional amenities, and open areas for relaxation and activity, planned to support a comfortable, well-balanced lifestyle.</p>
          </Reveal>
        </div>
        <Reveal className="amenity-groups">
          {data.amenityGroups.map((g) => (
            <div className="amenity-group" key={g.title}>
              <h3>{g.title}</h3>
              <ul>
                {g.items.map((a) => {
                  const Icon = ICONS[a.name] ?? Building;
                  return (
                    <li key={a.name}>
                      <Icon aria-hidden />
                      <span>
                        {a.name}
                        <small>
                          {a.where}
                          {a.planRef ? ` · plan no. ${a.planRef}` : ''}
                        </small>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </Reveal>
        <p className="source-note" style={{ marginTop: 10 }}>
          Amenity list as printed on brochure p.8. Plan numbers refer to the stilt (p.10) and terrace (p.13) plans.
        </p>

        <div className="amenity-feature">
          {featured.slice(0, 6).map((a, i) => (
            <figure key={a.image} className={`af-${i + 1}`} onClick={() => openLightbox(lb, i)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openLightbox(lb, i)} aria-label={`Open ${a.name}`}>
              <Img src={a.image} alt={`${a.name} (brochure render)`} sizes={i < 2 ? '(max-width: 860px) 100vw, 55vw' : '(max-width: 860px) 50vw, 25vw'} />
              <figcaption>
                <b>{a.name}</b>
                {a.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        {featured.length > 6 && (
          <div className="thumbs" style={{ marginTop: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {featured.slice(6).map((a, i) => (
              <button key={a.image} onClick={() => openLightbox(lb, i + 6)} aria-label={`Open ${a.name}`}>
                <Img src={a.image} alt={a.name} sizes="200px" />
              </button>
            ))}
          </div>
        )}

        <div className="level-plans">
          {plans.map((p) => (
            <Reveal key={p.key} className="level-plan">
              <button onClick={() => openLightbox([{ src: p.img, caption: `${p.title} plan`, note: `Brochure illustration · p.${p.page}`, kind: 'plan' }])} aria-label={`Open ${p.title} plan`}>
                <img src={mediaInfo(p.img)?.src} srcSet={mediaInfo(p.img)?.srcSet} sizes="(max-width: 860px) 100vw, 50vw" alt={`${p.title} plan - original brochure illustration`} loading="lazy" width={mediaInfo(p.img)?.width} height={mediaInfo(p.img)?.height} />
              </button>
              <div className="body">
                <h3>{p.title}</h3>
                <ul className="legend-list">
                  {p.legend.map((l) => (
                    <li key={l.n}>
                      <b>{l.n}</b>
                      {l.name}
                    </li>
                  ))}
                </ul>
                <p className="source-note" style={{ marginTop: 10 }}>
                  Brochure p.{p.page}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
