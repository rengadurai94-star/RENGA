import { ArrowLeft, Download, Save, Upload } from 'lucide-react';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { data as original, mediaInfo } from '../data/project';
import type { ProjectData } from '../data/types';
import './editor.css';

/**
 * Project Data Editor - for non-developers.
 * Edits src/data/project-data.json through simple forms.
 *  - While running `npm run dev`: "Save" writes the file directly (a .bak copy is kept).
 *  - On the published site: "Download" the file and replace src/data/project-data.json, then rebuild.
 */

const TABS = ['Project', 'Contact', 'Residences', 'Unit types', 'Floors', 'Location', 'Gallery', 'Advanced (JSON)'] as const;
type Tab = (typeof TABS)[number];
const STATUS = ['', 'Available', 'Booked', 'Sold', 'Blocked'];
const DEV = import.meta.env.DEV;

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));
const strOrNull = (v: string) => (v.trim() === '' ? null : v);

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`ed-field${wide ? ' wide' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function DataEditor() {
  const [draft, setDraft] = useState<ProjectData>(() => structuredClone(original));
  const [tab, setTab] = useState<Tab>('Residences');
  const [status, setStatus] = useState<{ msg: string; err?: boolean } | null>(null);
  const [raw, setRaw] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(original), [draft]);

  const update = (fn: (d: ProjectData) => void) =>
    setDraft((prev) => {
      const n = structuredClone(prev);
      fn(n);
      n.meta.lastUpdated = new Date().toISOString().slice(0, 10);
      return n;
    });

  const validate = (d: ProjectData): string | null => {
    const ids = new Set<string>();
    for (const u of d.units) {
      if (!u.id) return 'Every residence needs a reference.';
      if (ids.has(u.id)) return `Duplicate residence reference: ${u.id}`;
      ids.add(u.id);
      if (!d.floors.find((f) => f.id === u.floor)) return `Residence ${u.id} points to an unknown floor "${u.floor}".`;
      if (u.type && !d.unitTypes[u.type]) return `Residence ${u.id} uses unknown unit type "${u.type}".`;
    }
    for (const [k, t] of Object.entries(d.unitTypes)) {
      for (const f of ['carpetAreaSqft', 'balconyAreaSqft', 'superBuiltUpSqft', 'udsSqft'] as const) {
        const v = t[f];
        if (v !== null && (typeof v !== 'number' || Number.isNaN(v))) return `Type ${k}: "${f}" must be a number or empty.`;
      }
    }
    return null;
  };

  const save = async () => {
    const err = validate(draft);
    if (err) return setStatus({ msg: err, err: true });
    try {
      const r = await fetch('/__editor/save', { method: 'POST', body: JSON.stringify(draft) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      setStatus({ msg: 'Saved to src/data/project-data.json. The website has been updated.' });
    } catch (e) {
      setStatus({ msg: `Could not save automatically (${(e as Error).message}). Use "Download" instead.`, err: true });
    }
  };
  const download = () => {
    const err = validate(draft);
    if (err) return setStatus({ msg: err, err: true });
    const blob = new Blob([JSON.stringify(draft, null, 2) + '\n'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'project-data.json';
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus({ msg: 'Downloaded project-data.json. Replace src/data/project-data.json with it, then rebuild (npm run build).' });
  };
  const importFile = async (f: File) => {
    try {
      const d = JSON.parse(await f.text()) as ProjectData;
      const err = validate(d);
      if (err) throw new Error(err);
      setDraft(d);
      setStatus({ msg: `Imported ${f.name}. Review it, then Save or Download.` });
    } catch (e) {
      setStatus({ msg: `Import failed: ${(e as Error).message}`, err: true });
    }
  };
  const upload = async (file: File): Promise<string | null> => {
    if (!DEV) {
      setStatus({ msg: 'Image upload only works while running "npm run dev". On a published site, copy the image into public/media/uploads/ by hand.', err: true });
      return null;
    }
    const r = await fetch(`/__editor/upload?name=${encodeURIComponent(file.name)}`, { method: 'POST', body: file });
    const j = await r.json();
    if (!j.ok) {
      setStatus({ msg: j.error, err: true });
      return null;
    }
    return j.path as string;
  };

  const P = draft.project;
  return (
    <div className="editor">
      <div className="editor-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <a className="icon-btn" href="#/" aria-label="Back to the website" onClick={() => setTimeout(() => window.location.reload(), 0)}>
            <ArrowLeft />
          </a>
          <h1>Project data editor</h1>
          {dirty && <span className="tag teal">Unsaved changes</span>}
        </div>
        <div className="actions">
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>
            <Upload /> Import
          </button>
          <button className="btn ghost sm" onClick={download}>
            <Download /> Download
          </button>
          {DEV && (
            <button className="btn teal sm" onClick={save} disabled={!dirty}>
              <Save /> Save
            </button>
          )}
        </div>
      </div>
      <div className="editor-body">
        <div className="editor-help">
          <b>How to use.</b> Change the fields below. Leave a field empty when the information is not provided, and the website will hide it instead of inventing a value.
          <ol>
            {DEV ? <li>You are running the local editor: press <b>Save</b>. The website updates immediately.</li> : <li>Press <b>Download</b>, then replace <code>src/data/project-data.json</code> with the downloaded file and run <code>npm run build</code>.</li>}
            <li>Images: upload in the Gallery or Unit types tab (local editor only), or copy files into <code>public/media/uploads/</code>.</li>
          </ol>
        </div>
        {status && <div className={`ed-status${status.err ? ' err' : ''}`}>{status.msg}</div>}
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`tab${tab === t ? ' active' : ''}`}
              onClick={() => {
                if (t === 'Advanced (JSON)') setRaw(JSON.stringify(draft, null, 2));
                setTab(t);
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Project' && (
          <div className="ed-card">
            <h3>Project</h3>
            <div className="ed-grid">
              {(['name', 'shortName', 'byline', 'tagline', 'introLine', 'city', 'locality', 'state', 'developer', 'collaborator', 'buildingLevels', 'carpetToSuperBuiltUp'] as const).map((k) => (
                <Field key={k} label={k}>
                  <input value={P[k] ?? ''} onChange={(e) => update((d) => void (d.project[k] = e.target.value))} />
                </Field>
              ))}
              <Field label="Total residences">
                <input type="number" value={P.totalResidences} onChange={(e) => update((d) => void (d.project.totalResidences = Number(e.target.value)))} />
              </Field>
              <Field label="Residential floors">
                <input type="number" value={P.residentialFloors} onChange={(e) => update((d) => void (d.project.residentialFloors = Number(e.target.value)))} />
              </Field>
              <Field label="Price (empty = not shown)">
                <input value={P.price ?? ''} onChange={(e) => update((d) => void (d.project.price = strOrNull(e.target.value)))} />
              </Field>
              <Field label="Possession date (empty = not shown)">
                <input value={P.possessionDate ?? ''} onChange={(e) => update((d) => void (d.project.possessionDate = strOrNull(e.target.value)))} />
              </Field>
              <Field label="RERA number (empty = not shown)">
                <input value={P.reraNumber ?? ''} onChange={(e) => update((d) => void (d.project.reraNumber = strOrNull(e.target.value)))} />
              </Field>
              <Field label="Statement" wide>
                <textarea value={P.statement} onChange={(e) => update((d) => void (d.project.statement = e.target.value))} />
              </Field>
              <Field label="Unit mix" wide>
                <div className="ed-grid">
                  {P.unitMix.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6 }}>
                      <input value={m.configuration} onChange={(e) => update((d) => void (d.project.unitMix[i].configuration = e.target.value))} />
                      <input type="number" style={{ width: 80 }} value={m.count} onChange={(e) => update((d) => void (d.project.unitMix[i].count = Number(e.target.value)))} />
                    </div>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        )}

        {tab === 'Contact' && (
          <div className="ed-card">
            <h3>Contact</h3>
            <div className="ed-grid">
              {(['phone', 'whatsapp', 'email', 'website', 'siteAddress'] as const).map((k) => (
                <Field key={k} label={k} wide={k === 'siteAddress'}>
                  <input value={draft.contact[k] ?? ''} onChange={(e) => update((d) => void (d.contact[k] = strOrNull(e.target.value)))} />
                </Field>
              ))}
            </div>
          </div>
        )}

        {tab === 'Residences' && (
          <div className="ed-card">
            <h3>Residences ({draft.units.length})</h3>
            <p className="small">Enter official flat numbers and availability here when they are confirmed. Empty fields are hidden on the website.</p>
            <div className="ed-table-wrap">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Ref.</th>
                    <th>Floor</th>
                    <th>Unit type</th>
                    <th>Configuration (if no type)</th>
                    <th>Official flat no.</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.units.map((u, i) => (
                    <tr key={i}>
                      <td>
                        <input value={u.id} style={{ width: 80 }} onChange={(e) => update((d) => void (d.units[i].id = e.target.value))} />
                      </td>
                      <td>
                        <select value={u.floor} onChange={(e) => update((d) => void (d.units[i].floor = e.target.value))}>
                          {draft.floors.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select value={u.type ?? ''} onChange={(e) => update((d) => void (d.units[i].type = strOrNull(e.target.value)))}>
                          <option value="">-</option>
                          {Object.keys(draft.unitTypes).map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input value={u.configuration ?? ''} disabled={!!u.type} onChange={(e) => update((d) => void (d.units[i].configuration = e.target.value || undefined))} />
                      </td>
                      <td>
                        <input value={u.officialNumber ?? ''} placeholder="Not provided" onChange={(e) => update((d) => void (d.units[i].officialNumber = strOrNull(e.target.value)))} />
                      </td>
                      <td>
                        <select value={u.status ?? ''} onChange={(e) => update((d) => void (d.units[i].status = strOrNull(e.target.value)))}>
                          {STATUS.map((s) => (
                            <option key={s} value={s}>
                              {s || 'Not shown'}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input value={u.note ?? ''} onChange={(e) => update((d) => void (d.units[i].note = e.target.value || undefined))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'Unit types' &&
          Object.entries(draft.unitTypes).map(([k, t]) => (
            <div className="ed-card" key={k}>
              <h3>
                Unit Type {k} · {t.configuration}
              </h3>
              <div className="ed-grid">
                <Field label="Configuration">
                  <input value={t.configuration} onChange={(e) => update((d) => void (d.unitTypes[k].configuration = e.target.value))} />
                </Field>
                {(['carpetAreaSqft', 'balconyAreaSqft', 'superBuiltUpSqft', 'udsSqft'] as const).map((f) => (
                  <Field key={f} label={f.replace('Sqft', ' (sq.ft.)')}>
                    <input type="number" step="0.01" value={t[f] ?? ''} onChange={(e) => update((d) => void (d.unitTypes[k][f] = numOrNull(e.target.value)))} />
                  </Field>
                ))}
                {(['vastu', 'buildingEntry', 'flatEntry', 'bedrooms', 'kitchen', 'bathrooms', 'availableOn', 'positionOnFloor'] as const).map((f) => (
                  <Field key={f} label={f}>
                    <input value={t[f] ?? ''} onChange={(e) => update((d) => void (d.unitTypes[k][f] = strOrNull(e.target.value)))} />
                  </Field>
                ))}
                <Field label="Plan image" wide>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {t.plan && <img className="ed-thumb" src={mediaInfo(t.plan)?.src} alt="" style={{ objectFit: 'contain', background: '#fff' }} />}
                    <input value={t.plan ?? ''} onChange={(e) => update((d) => void (d.unitTypes[k].plan = strOrNull(e.target.value)))} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const p = await upload(f);
                        if (p) update((d) => void (d.unitTypes[k].plan = p));
                      }}
                    />
                  </div>
                </Field>
                <Field label="Rooms (name - size)" wide>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {t.rooms.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 6 }}>
                        <input value={r.name} onChange={(e) => update((d) => void (d.unitTypes[k].rooms[i].name = e.target.value))} />
                        <input value={r.size} onChange={(e) => update((d) => void (d.unitTypes[k].rooms[i].size = e.target.value))} />
                        <button className="ed-mini" type="button" onClick={() => update((d) => void d.unitTypes[k].rooms.splice(i, 1))}>
                          Remove
                        </button>
                      </div>
                    ))}
                    <button className="ed-mini" type="button" style={{ justifySelf: 'start' }} onClick={() => update((d) => void d.unitTypes[k].rooms.push({ name: '', size: '' }))}>
                      + Add room
                    </button>
                  </div>
                </Field>
              </div>
            </div>
          ))}

        {tab === 'Floors' && (
          <div className="ed-card">
            <h3>Floors</h3>
            {draft.floors.map((f, i) => (
              <div className="ed-grid" key={f.id} style={{ marginBottom: 14 }}>
                <Field label={`Label (${f.id})`}>
                  <input value={f.label} onChange={(e) => update((d) => void (d.floors[i].label = e.target.value))} />
                </Field>
                <Field label="Short label">
                  <input value={f.shortLabel} onChange={(e) => update((d) => void (d.floors[i].shortLabel = e.target.value))} />
                </Field>
                <Field label="Summary" wide>
                  <input value={f.summary} onChange={(e) => update((d) => void (d.floors[i].summary = e.target.value))} />
                </Field>
              </div>
            ))}
          </div>
        )}

        {tab === 'Location' && (
          <div className="ed-card">
            <h3>Location</h3>
            <div className="ed-grid">
              <Field label="Address" wide>
                <input value={draft.location.address} onChange={(e) => update((d) => void (d.location.address = e.target.value))} />
              </Field>
              <Field label="Map link" wide>
                <input value={draft.location.mapLink ?? ''} onChange={(e) => update((d) => void (d.location.mapLink = strOrNull(e.target.value)))} />
              </Field>
              <Field label="Description" wide>
                <textarea value={draft.location.description} onChange={(e) => update((d) => void (d.location.description = e.target.value))} />
              </Field>
            </div>
            {draft.location.categories.map((c, ci) => (
              <div key={ci} style={{ marginTop: 18 }}>
                <b>{c.title}</b>
                {c.places.map((p, pi) => (
                  <div key={pi} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <input value={p.name} onChange={(e) => update((d) => void (d.location.categories[ci].places[pi].name = e.target.value))} />
                    <input style={{ width: 120 }} value={p.distance ?? ''} onChange={(e) => update((d) => void (d.location.categories[ci].places[pi].distance = strOrNull(e.target.value)))} />
                    <input style={{ width: 120 }} value={p.time ?? ''} onChange={(e) => update((d) => void (d.location.categories[ci].places[pi].time = strOrNull(e.target.value)))} />
                    <button className="ed-mini" onClick={() => update((d) => void d.location.categories[ci].places.splice(pi, 1))}>
                      Remove
                    </button>
                  </div>
                ))}
                <button className="ed-mini" style={{ marginTop: 6 }} onClick={() => update((d) => void d.location.categories[ci].places.push({ name: '', distance: null, time: null }))}>
                  + Add place
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'Gallery' && (
          <div className="ed-card">
            <h3>Gallery ({draft.gallery.length})</h3>
            <p className="small">Use only original project images. "Captioned" means the caption is printed in the brochure.</p>
            <div className="ed-table-wrap">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th />
                    <th>Image path</th>
                    <th>Caption</th>
                    <th>Category</th>
                    <th>Page</th>
                    <th>Captioned</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {draft.gallery.map((g, i) => (
                    <tr key={g.id}>
                      <td>
                        <img className="ed-thumb" src={mediaInfo(g.src)?.src} alt="" />
                      </td>
                      <td>
                        <input value={g.src} onChange={(e) => update((d) => void (d.gallery[i].src = e.target.value))} />
                      </td>
                      <td>
                        <input value={g.caption} onChange={(e) => update((d) => void (d.gallery[i].caption = e.target.value))} />
                      </td>
                      <td>
                        <input value={g.category} style={{ width: 130 }} onChange={(e) => update((d) => void (d.gallery[i].category = e.target.value))} />
                      </td>
                      <td>
                        <input type="number" style={{ width: 64 }} value={g.page} onChange={(e) => update((d) => void (d.gallery[i].page = Number(e.target.value)))} />
                      </td>
                      <td>
                        <input type="checkbox" checked={g.captioned} onChange={(e) => update((d) => void (d.gallery[i].captioned = e.target.checked))} />
                      </td>
                      <td>
                        <div className="ed-row-actions">
                          <button className="ed-mini" disabled={i === 0} onClick={() => update((d) => void d.gallery.splice(i - 1, 0, d.gallery.splice(i, 1)[0]))}>
                            ↑
                          </button>
                          <button className="ed-mini" disabled={i === draft.gallery.length - 1} onClick={() => update((d) => void d.gallery.splice(i + 1, 0, d.gallery.splice(i, 1)[0]))}>
                            ↓
                          </button>
                          <button className="ed-mini" onClick={() => update((d) => void d.gallery.splice(i, 1))}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="small">Add an original photo:</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const p = await upload(f);
                  if (p) update((d) => void d.gallery.push({ id: `upload-${Date.now()}`, src: p, category: 'Residences', caption: f.name.replace(/\.[^.]+$/, ''), page: 0, captioned: false }));
                }}
              />
            </div>
          </div>
        )}

        {tab === 'Advanced (JSON)' && (
          <div className="ed-card">
            <h3>Raw data (advanced)</h3>
            <textarea className="ed-raw" value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false} />
            <button
              className="btn sm"
              style={{ marginTop: 10 }}
              onClick={() => {
                try {
                  const d = JSON.parse(raw) as ProjectData;
                  const err = validate(d);
                  if (err) throw new Error(err);
                  setDraft(d);
                  setStatus({ msg: 'JSON applied.' });
                } catch (e) {
                  setStatus({ msg: `Invalid JSON: ${(e as Error).message}`, err: true });
                }
              }}
            >
              Apply JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
