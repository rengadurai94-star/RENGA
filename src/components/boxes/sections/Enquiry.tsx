"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { project } from "@/config/project";
import Reveal, { SectionLabel } from "./Reveal";

type Status = "idle" | "sending" | "sent" | "error";
interface Errors {
  name?: string;
  phone?: string;
  email?: string;
  consent?: string;
}

export function validateEnquiry(data: Record<string, string>): Errors {
  const e: Errors = {};
  if (!data.name || data.name.trim().length < 2) e.name = "Please enter your name.";
  const phone = (data.phone ?? "").replace(/[\s()-]/g, "");
  if (!/^\+?\d{10,13}$/.test(phone)) e.phone = "Enter a valid phone number (10–13 digits).";
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email address.";
  if (data.consent !== "on") e.consent = "Please accept to be contacted.";
  return e;
}

function Field({
  label,
  name,
  type = "text",
  error,
  required,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-label text-taupe">
        {label}
        {required && " *"}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-2 block w-full border-b bg-transparent pb-3 text-lg text-charcoal outline-none transition-colors placeholder:text-stone focus:border-charcoal ${
          error ? "border-red-700/70" : "hairline"
        }`}
      />
      {error && (
        <span id={`${name}-error`} className="mt-1 block text-xs text-red-800">
          {error}
        </span>
      )}
    </label>
  );
}

export default function Enquiry() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    const errs = validateEnquiry(data);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; reference?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Something went wrong");
      setMessage(json.reference ?? "");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const c = project.contact;
  return (
    <section id="enquire" className="relative bg-paper px-6 py-28 md:px-12 md:py-40">
      <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-12">
        <Reveal className="md:col-span-5">
          <SectionLabel index="07">Enquire</SectionLabel>
          <h2 className="mt-8 font-display text-5xl font-light leading-[1.02] text-charcoal md:text-7xl">{c.heading}</h2>
          <dl className="mt-12 space-y-5 text-sm">
            {[
              ["Phone", c.phone],
              ["Email", c.email],
              ["Site office", c.address],
              ["Visits", c.hours],
            ].map(([k, v]) => (
              <div key={k} className="border-t hairline pt-3">
                <dt className="text-[10px] uppercase tracking-label text-taupe">{k}</dt>
                <dd className="mt-1 text-charcoal">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[11px] text-taupe">Contact details above are placeholders.</p>
        </Reveal>
        <Reveal className="md:col-span-6 md:col-start-7" delay={0.1}>
          <AnimatePresence mode="wait">
            {status === "sent" ? (
              <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-bone p-10" role="status">
                <p className="text-[10px] uppercase tracking-label text-bronze-dark">Thank you</p>
                <p className="mt-4 font-display text-4xl font-light text-charcoal">Your enquiry has been received.</p>
                <p className="mt-4 text-sm text-ash">
                  Reference <span className="font-mono">{message}</span>. In this prototype enquiries are validated and logged on the server only — connect
                  `src/app/api/enquiry/route.ts` to your CRM or email service before launch.
                </p>
                <button type="button" className="btn-ghost mt-8" onClick={() => setStatus("idle")}>
                  Send another
                </button>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} noValidate className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid gap-8 sm:grid-cols-2">
                  <Field label="Full name" name="name" required error={errors.name} autoComplete="name" />
                  <Field label="Phone" name="phone" type="tel" required error={errors.phone} autoComplete="tel" />
                </div>
                <Field label="Email" name="email" type="email" error={errors.email} autoComplete="email" />
                <label className="block">
                  <span className="text-[10px] uppercase tracking-label text-taupe">Interested in</span>
                  <select name="interest" className="mt-2 block w-full border-b hairline bg-transparent pb-3 text-lg text-charcoal outline-none focus:border-charcoal" defaultValue="">
                    <option value="">Any residence</option>
                    {project.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label} · {u.facing} facing
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase tracking-label text-taupe">Message</span>
                  <textarea name="message" rows={3} className="mt-2 block w-full resize-none border-b hairline bg-transparent pb-3 text-lg text-charcoal outline-none focus:border-charcoal" />
                </label>
                <label className="flex items-start gap-3 text-sm text-ash">
                  <input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[#a27b52]" aria-invalid={!!errors.consent} />
                  <span>
                    I agree to be contacted about {project.name}.
                    {errors.consent && <span className="block text-xs text-red-800">{errors.consent}</span>}
                  </span>
                </label>
                {status === "error" && (
                  <p className="text-sm text-red-800" role="alert">
                    {message} — please try again.
                  </p>
                )}
                <button type="submit" className="btn-primary" disabled={status === "sending"}>
                  {status === "sending" ? "Sending…" : "Request a call back"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
