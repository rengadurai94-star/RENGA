import { Gauge, Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { saveQuality } from '../utils/device';
import { scrollToId } from '../utils/actions';
import { setState, useStore } from '../utils/store';

const LINKS: [string, string][] = [
  ['overview', 'Overview'],
  ['explore', 'Explore'],
  ['plans', 'Floor Plans'],
  ['gallery', 'Gallery'],
  ['amenities', 'Amenities'],
  ['specifications', 'Specifications'],
  ['location', 'Location'],
  ['contact', 'Contact'],
];

export default function Nav() {
  const introDone = useStore((s) => s.introDone);
  const section = useStore((s) => s.section);
  const quality = useStore((s) => s.quality);
  const webgl = useStore((s) => s.webgl);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const on = () => {
      setSolid(window.scrollY > window.innerHeight * 0.6);
      let cur = '';
      for (const [id] of LINKS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) cur = id;
      }
      setActive(cur);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };
  const toggleQuality = () => {
    const q = quality === 'high' ? 'low' : 'high';
    saveQuality(q);
    setState({ quality: q });
  };

  return (
    <>
      <header className={`nav${solid || section === 'explore' || open ? ' solid' : ''}${introDone ? '' : ' hidden'}`}>
        <button className="nav-logo" onClick={() => go('top')} aria-label="Back to top">
          <img src={solid || section === 'explore' || open ? './brand/shan-poornam-logo-on-light.svg' : './brand/shan-poornam-logo-on-dark.svg'} alt="Shan Poornam Residence by ENS" width={94} height={38} />
        </button>
        <nav aria-label="Sections">
          <ul className="nav-links">
            {LINKS.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className={active === id ? 'active' : ''}
                  onClick={(e) => {
                    e.preventDefault();
                    go(id);
                  }}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nav-actions">
          {webgl && (
            <button className="quality-toggle" onClick={toggleQuality} title="Switch 3D rendering quality" data-testid="quality-toggle" aria-pressed={quality === 'low'}>
              {quality === 'high' ? <Sparkles /> : <Gauge />}
              <span className="q-label">{quality === 'high' ? 'High quality' : 'Performance'}</span>
            </button>
          )}
          <button className="btn sm enquire" onClick={() => go('contact')}>
            Enquire
          </button>
          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <div className={`mobile-menu${open ? ' open' : ''}`} aria-hidden={!open}>
        {LINKS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            tabIndex={open ? 0 : -1}
            onClick={(e) => {
              e.preventDefault();
              go(id);
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </>
  );
}
