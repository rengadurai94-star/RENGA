import { ArrowLeft, ArrowRight, Box, Info, MessageCircle, X, ZoomIn } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { openLightbox } from '../components/Lightbox';
import { Img } from '../components/ui';
import { data, DIRECTION_NAMES, floorById, unitById, unitConfiguration, unitsOnFloor, unitTitle, unitTypeOf } from '../data/project';
import { closeDetail, scrollToId, selectUnit, viewUnitIn3D } from '../utils/actions';
import { setState, useStore } from '../utils/store';
import PlanSvg from './PlanSvg';

const dir = (v: string | null) =>
  v
    ? v
        .split('/')
        .map((d) => DIRECTION_NAMES[d.trim()] ?? d.trim())
        .join(' / ')
    : null;

export default function ApartmentDetail() {
  const open = useStore((s) => s.detailOpen);
  const id = useStore((s) => s.selectedUnit);
  const webgl = useStore((s) => s.webgl);
  const u = unitById(id);
  const t = unitTypeOf(u);
  const f = floorById(u?.floor);
  const scroller = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [id]);
  useEffect(() => {
    if (open) closeRef.current?.focus({ preventScroll: true });
  }, [open]);

  const siblings = u ? unitsOnFloor(u.floor) : [];
  const idx = u ? siblings.findIndex((x) => x.id === u.id) : -1;
  const level = f ? { f1: 1, f2: 2, f3: 3, f4: 4 }[f.id as 'f1'] : undefined;
  const residenceImgs = data.residenceGallery.map((gid) => data.gallery.find((g) => g.id === gid)).filter(Boolean) as typeof data.gallery;

  const enquire = () => {
    if (!u) return;
    closeDetail();
    window.dispatchEvent(new CustomEvent('spr:enquire', { detail: { unit: u.id } }));
    scrollToId('contact');
  };

  return (
    <>
      <div className={`drawer-backdrop${open ? ' open' : ''}`} onClick={closeDetail} aria-hidden />
      <aside className={`drawer${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open} aria-label={u ? `${unitTitle(u)} details` : 'Residence details'} data-testid="apartment-detail" inert={!open}>
        {u && (
          <>
            <div className="drawer-top">
              <span className="crumbs">
                {data.project.shortName} / {f?.label} / Ref. {u.id}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="icon-btn" disabled={idx <= 0} onClick={() => selectUnit(siblings[idx - 1].id)} aria-label="Previous residence on this floor">
                  <ArrowLeft />
                </button>
                <button className="icon-btn" disabled={idx < 0 || idx >= siblings.length - 1} onClick={() => selectUnit(siblings[idx + 1].id)} aria-label="Next residence on this floor">
                  <ArrowRight />
                </button>
                <button ref={closeRef} className="icon-btn" onClick={closeDetail} aria-label="Close details" data-testid="detail-close">
                  <X />
                </button>
              </div>
            </div>
            <div className="drawer-scroll" ref={scroller}>
              <div className="drawer-hero">
                <p className="eyebrow">{f?.label}</p>
                <h2 className="display" data-testid="detail-title">
                  {unitTitle(u)} · <em>{unitConfiguration(u)}</em>
                </h2>
                <div className="tags">
                  <span className="tag">Ref. {u.id}</span>
                  {u.officialNumber ? <span className="tag">Flat No. {u.officialNumber}</span> : null}
                  {t?.vastu && <span className="tag teal">{t.vastu}</span>}
                  {u.status && <span className="tag">{u.status}</span>}
                </div>
                {!u.officialNumber && (
                  <p className="source-note" style={{ marginTop: 12 }}>
                    "Ref." is a website reference (floor + unit type). The brochure gives no official flat numbers.
                  </p>
                )}
              </div>

              {t ? (
                <>
                  <div className="drawer-block">
                    <h3>Areas</h3>
                    <div className="kv-grid" data-testid="detail-areas">
                      {t.carpetAreaSqft != null && (
                        <div>
                          <b>
                            {t.carpetAreaSqft.toLocaleString('en-IN')}
                            <small>sq.ft.</small>
                          </b>
                          <span>Carpet area</span>
                        </div>
                      )}
                      {t.superBuiltUpSqft != null && (
                        <div>
                          <b>
                            {t.superBuiltUpSqft.toLocaleString('en-IN')}
                            <small>sq.ft.</small>
                          </b>
                          <span>Super built-up area</span>
                        </div>
                      )}
                      {t.balconyAreaSqft != null && (
                        <div>
                          <b>
                            {t.balconyAreaSqft}
                            <small>sq.ft.</small>
                          </b>
                          <span>Exclusive balcony</span>
                        </div>
                      )}
                      {t.udsSqft != null && (
                        <div>
                          <b>
                            {t.udsSqft}
                            <small>sq.ft.</small>
                          </b>
                          <span>UDS</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="drawer-block">
                    <h3>Orientation (Vastu)</h3>
                    <dl className="rows">
                      {[
                        ['Facing', t.vastu],
                        ['Building entry', dir(t.buildingEntry)],
                        ['Flat entry', dir(t.flatEntry)],
                        ['Bedrooms', dir(t.bedrooms)],
                        ['Kitchen', dir(t.kitchen)],
                        ['Bathrooms', dir(t.bathrooms)],
                        ['Position on floor', t.positionOnFloor],
                        ['Available on', t.availableOn],
                      ]
                        .filter(([, v]) => v)
                        .map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                    </dl>
                  </div>

                  <div className="drawer-block">
                    <h3>Rooms (as printed)</h3>
                    <dl className="rows">
                      {t.rooms.map((r, i) => (
                        <div key={i}>
                          <dt>{r.name}</dt>
                          <dd>{r.size}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {t.plan && (
                    <div className="drawer-block">
                      <h3>Original floor plan · Type {u.type}</h3>
                      <button
                        className="plan-frame"
                        style={{ width: '100%' }}
                        onClick={() => openLightbox([{ src: t.plan!, caption: `Unit Type ${u.type} · ${t.configuration}`, note: t.source, kind: 'plan' }])}
                        aria-label="Open the original floor plan full screen"
                        data-testid="detail-plan"
                      >
                        <Img src={t.plan} alt={`Original floor plan of Unit Type ${u.type} (${t.configuration}) from the brochure`} sizes="600px" />
                        <span className="icon-btn zoom-hint" aria-hidden>
                          <ZoomIn />
                        </span>
                      </button>
                      <p className="source-note" style={{ marginTop: 8 }}>
                        {t.source}. Dimensions in feet, as printed. Plans are artists' impressions and not to scale.
                      </p>
                    </div>
                  )}

                  {level && (
                    <div className="drawer-block">
                      <h3>Location on the {f?.label}</h3>
                      <div style={{ maxWidth: 360, margin: '0 auto' }}>
                        <PlanSvg level={level} highlight={u.id} dimOthers onSelect={(nid) => selectUnit(nid)} />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="drawer-block">
                  <div className="notice">
                    <Info />
                    <span>{u.note ?? 'Detailed information for this residence is not provided in the brochure.'}</span>
                  </div>
                  <dl className="rows" style={{ marginTop: 16 }}>
                    <div>
                      <dt>Configuration</dt>
                      <dd>{unitConfiguration(u)}</dd>
                    </div>
                    <div>
                      <dt>Floor</dt>
                      <dd>{f?.label}</dd>
                    </div>
                    <div>
                      <dt>Areas · facing · plan</dt>
                      <dd>Not provided</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="drawer-block">
                <h3>Interior visuals from the brochure</h3>
                <div className="thumbs">
                  {residenceImgs.map((g, i) => (
                    <button
                      key={g.id}
                      onClick={() =>
                        openLightbox(
                          residenceImgs.map((x) => ({ src: x.src, caption: x.caption, note: `Brochure p.${x.page} · artist's impression` })),
                          i,
                        )
                      }
                      aria-label={`Open ${g.caption}`}
                    >
                      <Img src={g.src} alt={`${g.caption} (brochure p.${g.page})`} sizes="200px" />
                    </button>
                  ))}
                </div>
                <p className="source-note" style={{ marginTop: 10 }}>
                  These are the brochure's interior artist's impressions (pp.24–25). The brochure does not link them to a specific unit type, so they are representative only.
                </p>
              </div>

              <div className="drawer-block">
                <h3>Specifications</h3>
                <dl className="rows">
                  {data.specifications
                    .filter((g) => ['Floor Finishes', 'Kitchen & Dining', 'Bathrooms'].includes(g.title))
                    .flatMap((g) => g.items.slice(0, 2).map((it) => ({ ...it, g: g.title })))
                    .map((it) => (
                      <div key={it.g + it.label}>
                        <dt>{it.label}</dt>
                        <dd>{it.value}</dd>
                      </div>
                    ))}
                </dl>
                <button
                  className="text-link"
                  style={{ marginTop: 14 }}
                  onClick={() => {
                    setState({ detailOpen: false });
                    scrollToId('specifications');
                  }}
                >
                  All specifications <ArrowRight />
                </button>
              </div>
            </div>
            <div className="drawer-foot">
              {webgl ? (
                <button className="btn ghost sm" onClick={() => viewUnitIn3D(u.id)} data-testid="view-in-3d">
                  <Box /> View in 3D
                </button>
              ) : (
                <span />
              )}
              <button className="btn teal sm" onClick={enquire}>
                <MessageCircle /> Enquire about {u.id}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
