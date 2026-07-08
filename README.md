# Urban Mark Interior

A cinematic, scroll-driven marketing site for **Urban Mark Interior**, a premium
interior design studio. Built with Next.js (App Router), GSAP + ScrollTrigger,
Lenis smooth scroll, and Framer Motion.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Lenis** for smooth scrolling, driven by the GSAP ticker
- **GSAP + ScrollTrigger** for the pinned cinematic journey, the pinned
  philosophy reveal, scroll-based reveals, and the animated stat counters
- **Framer Motion** for the fullscreen nav overlay and preloader transitions
- Custom cursor + magnetic buttons built directly on GSAP (no extra deps)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `src/app/layout.tsx` — fonts (Fraunces + Inter), preloader, cursor, nav, smooth scroll provider
- `src/components/sections/` — the ten sections from the brief, in order:
  `CinematicJourney` (hero + the 5-chapter villa "video" scrub), `WhoWeAre`,
  `Expertise`, `Philosophy` (pinned), `Projects`, `Materials`, `Process`,
  `Testimonials`, `Consultation`, plus `Footer` at the root
- `src/components/PlaceholderMedia.tsx` — the placeholder visual system
  (gradient/grain "swatches" per room/material) standing in for real
  photography and video

## About the placeholder media

This build does **not** include AI-generated hero imagery or video. Real
Seedance 2.0 generation (hero image reference + the 5 villa-tour clips) was
scoped out of this pass to avoid spending Higgsfield credits without your
sign-off — see `PlaceholderMedia.tsx` for the full list of tones/rooms used
across the site (`hero`, `villa`, `penthouse`, `marble`, `oak`, `brass`, etc).

To swap in real media later:

1. Generate the hero image + 5 chapter videos (see the brief for exact prompts).
2. Drop the files into `public/media/`.
3. Replace the relevant `<PlaceholderMedia tone="..." />` usages with `<video>` /
   `next/image` elements — the GSAP timelines in `CinematicJourney.tsx` and the
   hover/scroll triggers elsewhere are already wired to the same DOM structure,
   so only the media element itself needs to change.

## Verification performed

- `npx tsc --noEmit` — no type errors
- `npm run lint` — no errors
- Manual Playwright pass across desktop (1440×900) and mobile (390×844)
  viewports: scroll-driven animations, pinned sections, animated counters,
  hover states, nav overlay open/close, magnetic buttons/custom cursor,
  horizontal testimonial scroll — no console errors observed
