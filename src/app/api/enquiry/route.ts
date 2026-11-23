import { NextResponse } from "next/server";

/**
 * Enquiry endpoint (prototype). Validates the payload and logs it on the
 * server. Connect this to your CRM / email provider before going live.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }
  const str = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 2000) : "");
  const name = str(body.name);
  const phone = str(body.phone).replace(/[\s()-]/g, "");
  const email = str(body.email);
  const interest = str(body.interest);
  const message = str(body.message);

  if (name.length < 2) return NextResponse.json({ ok: false, error: "Name is required" }, { status: 422 });
  if (!/^\+?\d{10,13}$/.test(phone)) return NextResponse.json({ ok: false, error: "A valid phone number is required" }, { status: 422 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: "Email looks invalid" }, { status: 422 });
  if (body.consent !== "on") return NextResponse.json({ ok: false, error: "Consent is required" }, { status: 422 });

  const reference = `BX-${Date.now().toString(36).toUpperCase()}`;
  // Prototype: log only. Do not store personal data until a proper backend is configured.
  console.info("[enquiry]", reference, { interest, hasEmail: Boolean(email), messageLength: message.length });
  return NextResponse.json({ ok: true, reference });
}
