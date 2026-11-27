# generated/

Empty by design: **no AI image has been generated yet.** The Higgsfield account had 0 credits on 27 Nov 2026.

When you run a request from `../prompts/generation-requests.json`, save its output here as `<category>/<PROMPT-ID>.png`, for example `living/LIV-01.png`. Then:

1. Run the request's QA checklist against its brochure reference.
2. Publish it with `python3 -I sp-residency/scripts/build_web_assets.py --root . --generated`.
3. Set `approval` in `public/images/sp-residency/manifest.json` once the client signs off.
