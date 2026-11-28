import { useMemo, useState } from 'react';
import { data } from '../data/project';
import { openLightbox } from './Lightbox';
import { Img, Reveal } from './ui';

export default function Gallery() {
  const cats = useMemo(() => ['All', ...Array.from(new Set(data.gallery.map((g) => g.category)))], []);
  const [cat, setCat] = useState('All');
  const items = data.gallery.filter((g) => cat === 'All' || g.category === cat);
  const toLb = items.map((g) => ({
    src: g.src,
    caption: g.caption,
    note: `${g.captioned ? 'Caption as printed' : 'Descriptive label (uncaptioned in brochure)'} · brochure p.${g.page} · artist's impression`,
  }));
  return (
    <section className="section" id="gallery" aria-labelledby="gallery-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Original Gallery</p>
            <h2 id="gallery-title" className="display h2">
              Seen <em>exactly</em> as presented.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">
              Every image comes from the project brochure, unaltered, at its original proportions. These are the developer's artist's impressions. No stock or AI-generated images are used.
            </p>
          </Reveal>
        </div>
        <div className="chips" role="tablist" aria-label="Filter gallery">
          {cats.map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={`chip${cat === c ? ' active' : ''}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="gallery-grid" data-testid="gallery-grid">
          {items.map((g, i) => (
            <button key={g.id} className="g-item" onClick={() => openLightbox(toLb, i)} aria-label={`Open ${g.caption}`} data-testid={`gallery-item-${g.id}`}>
              <figure style={{ margin: 0 }}>
                <Img src={g.src} alt={`${g.caption} - brochure p.${g.page}`} sizes="(max-width: 700px) 100vw, 33vw" />
                <figcaption>
                  <span>{g.caption}</span>
                  <small>p.{g.page}</small>
                </figcaption>
              </figure>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
