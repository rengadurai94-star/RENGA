import { Globe, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { data, unitConfiguration } from '../data/project';
import { Reveal } from './ui';

const digits = (s: string | null) => (s ? s.replace(/[^\d]/g, '') : '');

export default function Contact() {
  const c = data.contact;
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: 'Any residence', message: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const on = (e: Event) => {
      const unit = (e as CustomEvent<{ unit: string }>).detail.unit;
      const u = data.units.find((x) => x.id === unit);
      if (u) setForm((f) => ({ ...f, interest: `Ref. ${u.id} · ${u.type ? `Type ${u.type} · ` : ''}${unitConfiguration(u)}` }));
    };
    window.addEventListener('spr:enquire', on);
    return () => window.removeEventListener('spr:enquire', on);
  }, []);

  const text = () =>
    `Hello, I'm interested in ${data.project.name}.\nInterest: ${form.interest}\nName: ${form.name}\nPhone: ${form.phone}${form.email ? `\nEmail: ${form.email}` : ''}${form.message ? `\n\n${form.message}` : ''}`;
  const validate = () => {
    if (!form.name.trim() || digits(form.phone).length < 8) {
      setError('Please enter your name and a valid phone number.');
      return false;
    }
    setError('');
    return true;
  };
  const viaWhatsApp = () => {
    if (!validate() || !c.whatsapp) return;
    window.open(`https://wa.me/${digits(c.whatsapp)}?text=${encodeURIComponent(text())}`, '_blank', 'noopener');
  };
  const viaEmail = () => {
    if (!validate() || !c.email) return;
    window.location.href = `mailto:${c.email}?subject=${encodeURIComponent(`Enquiry - ${data.project.name} - ${form.interest}`)}&body=${encodeURIComponent(text())}`;
  };
  const options = ['Any residence', ...Object.entries(data.unitTypes).map(([k, t]) => `Type ${k} · ${t.configuration}`), ...data.units.filter((u) => !u.type).map((u) => `5th Floor · ${unitConfiguration(u)}`)];

  return (
    <section className="section contact on-dark" id="contact" aria-labelledby="contact-title">
      <div className="container contact-grid">
        <Reveal>
          <p className="eyebrow">Contact &amp; Enquiry</p>
          <h2 id="contact-title" className="display h2">
            Visit, call, <em>or write</em>.
          </h2>
          <p className="lede">Our sales team will share availability, pricing and the latest plans. The brochure does not include these.</p>
          <div className="contact-lines">
            {c.phone && (
              <a href={`tel:+${digits(c.phone)}`}>
                <Phone />
                <span>
                  <small>Call</small>
                  <b>{c.phone}</b>
                </span>
              </a>
            )}
            {c.whatsapp && (
              <a href={`https://wa.me/${digits(c.whatsapp)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle />
                <span>
                  <small>WhatsApp</small>
                  <b>{c.whatsapp}</b>
                </span>
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`}>
                <Mail />
                <span>
                  <small>Email</small>
                  <b>{c.email}</b>
                </span>
              </a>
            )}
            {c.website && (
              <a href={`https://${c.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer">
                <Globe />
                <span>
                  <small>Website</small>
                  <b>{c.website}</b>
                </span>
              </a>
            )}
            {c.siteAddress && (
              <div>
                <MapPin />
                <span>
                  <small>Site address</small>
                  <b style={{ fontSize: 19 }}>{c.siteAddress}</b>
                </span>
              </div>
            )}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              viaWhatsApp();
            }}
            aria-label="Enquiry form"
          >
            <div className="form-row">
              <div className="field">
                <label htmlFor="f-name">Name</label>
                <input id="f-name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="field">
                <label htmlFor="f-phone">Phone</label>
                <input id="f-phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="f-email">Email (optional)</label>
              <input id="f-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="f-int">Interested in</label>
              <select id="f-int" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} data-testid="enquiry-interest">
                {[form.interest, ...options.filter((o) => o !== form.interest)].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-msg">Message</label>
              <textarea id="f-msg" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="btn teal">
                <MessageCircle /> Send via WhatsApp
              </button>
              <button type="button" className="btn ghost" onClick={viaEmail}>
                <Send /> Send via Email
              </button>
            </div>
            <p className="source-note">This form stores nothing. It opens WhatsApp or your email app with your message ready to send.</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
