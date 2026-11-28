import { ExternalLink, MapPin } from 'lucide-react';
import { useState } from 'react';
import { data, mediaInfo } from '../data/project';
import { openLightbox } from './Lightbox';
import { Reveal } from './ui';

export default function Location() {
  const L = data.location;
  const [embed, setEmbed] = useState(false);
  const map = mediaInfo('media/location/location-map');
  return (
    <section className="section paper" id="location" aria-labelledby="loc-title">
      <div className="container">
        <div className="section-head">
          <Reveal>
            <p className="eyebrow">Location &amp; Connectivity</p>
            <h2 id="loc-title" className="display h2">
              Madurai's most <em>central</em> residential address.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lede">{L.description}</p>
          </Reveal>
        </div>

        <div className="location-grid">
          <div>
            <p className="address">
              <MapPin size={22} style={{ verticalAlign: '-3px', color: 'var(--teal)' }} /> {L.address}
            </p>
            <ul className="advantages" style={{ marginBottom: 36 }}>
              {L.whyItMatters.map((w, i) => (
                <li key={w}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {w}
                </li>
              ))}
            </ul>
            <div className="place-cats">
              {L.categories.map((c) => (
                <div className="place-cat" key={c.title}>
                  <h3>{c.title}</h3>
                  <ul>
                    {c.places.map((p) => (
                      <li key={p.name}>
                        <span>{p.name}</span>
                        <span className="d">{p.distance}</span>
                        <span className="t">{p.time ?? ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="source-note" style={{ marginTop: 18 }}>
              Distances and travel times as printed in the brochure (p.6). Also marked on the brochure map: {L.alsoOnMap.join(', ')}.
            </p>
          </div>

          <div className="map-card">
            {embed ? (
              <iframe
                className="map-embed"
                title="Map search for the printed site address"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(L.address)}&z=15&output=embed`}
              />
            ) : (
              map && (
                <button className="map-img" onClick={() => openLightbox([{ src: 'media/location/location-map', caption: 'Location map', note: 'Brochure p.7 · not to scale', kind: 'plan' }])} aria-label="Open the brochure location map">
                  <img src={map.src} srcSet={map.srcSet} sizes="(max-width: 980px) 100vw, 55vw" width={map.width} height={map.height} alt="Location map from the brochure showing nearby schools, colleges and hospitals" loading="lazy" />
                </button>
              )
            )}
            <div className="body">
              <span className="small">{embed ? 'Google Maps search for the printed address. The pin may be approximate.' : 'Brochure location map (p.7) · tap to enlarge'}</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn ghost sm" onClick={() => setEmbed((e) => !e)}>
                  {embed ? 'Show brochure map' : 'Interactive map'}
                </button>
                {L.mapLink && (
                  <a className="btn sm" href={L.mapLink} target="_blank" rel="noopener noreferrer" title={L.mapLinkSource}>
                    Open in Google Maps <ExternalLink />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
