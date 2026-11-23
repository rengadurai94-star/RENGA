# Runway Gen-4 Turbo Execution Plan — LOCKED

**Status:** Awaiting Zapier MCP reconnect to execute.

## Parameters
- **Model:** `gen4_turbo`
- **Aspect ratio:** `1280:720` (16:9)
- **Duration:** 10 seconds per clip
- **Order:** Sequential, Shot 1 → Shot 47
- **Stop trigger:** First `insufficient credits` error from Runway

## Pre-flight
1. Call `retrieve_credit_usage` to get current free credit balance.
2. Estimate clips affordable: `floor(credits / 25)`.
3. Report estimate to user before submitting first clip.

## Per-clip workflow
1. Submit `convert_image_to_video` is NOT used — use **text-to-video** path via Runway's image_to_video with a reference image, OR if pure text-to-video is preferred, call `_zap_raw_request` against Runway's `/v1/image_to_video` endpoint with no `promptImage`.
   - Note: Runway Gen-4 Turbo officially requires an image input. If text-only fails, fall back to: generate a Runway `generate_image` first (Gen-4 Image Turbo, 1920:1080), then `convert_image_to_video` with that image + motion prompt. Each shot then = 1 image gen + 1 video gen.
2. Poll `get_task` until `status: SUCCEEDED` or `FAILED`.
3. Append result to `output/runway-clips.md`:
   - Shot number
   - Original Bright Side prompt
   - Runway task ID
   - Video URL
   - Credits consumed
4. Every 5 successful clips → `git add output/ && git commit && git push`.

## Source of shot prompts
`output/two-moons-production-package.md` — Section 1 onward, in order.

## On stop / completion
- Final commit with summary: clips generated, credits used, last shot reached.
- Tell user which shots remain so they can either fund more credits or accept partial delivery.
