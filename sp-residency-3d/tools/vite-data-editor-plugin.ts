import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/**
 * Development-only helper for the Data Editor (/#/editor).
 * POST /__editor/save        -> writes src/data/project-data.json (a .bak copy is kept)
 * POST /__editor/upload?name -> saves an image into public/media/uploads/
 * Nothing here is included in the production build.
 */
export function dataEditorPlugin(): Plugin {
  return {
    name: 'spr-data-editor',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || req.method !== 'POST' || !req.url.startsWith('/__editor/')) return next();
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = Buffer.concat(chunks);
        try {
          if (req.url.startsWith('/__editor/save')) {
            const parsed = JSON.parse(body.toString('utf8'));
            if (!parsed || typeof parsed !== 'object' || !parsed.project || !Array.isArray(parsed.units)) {
              throw new Error('Rejected: this does not look like project-data.json');
            }
            const file = path.join(root, 'src/data/project-data.json');
            fs.copyFileSync(file, file + '.bak');
            fs.writeFileSync(file, JSON.stringify(parsed, null, 2) + '\n');
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, savedTo: 'src/data/project-data.json' }));
            return;
          }
          if (req.url.startsWith('/__editor/upload')) {
            const name = new URL(req.url, 'http://x').searchParams.get('name') ?? 'image';
            const safe = name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '');
            if (!/\.(jpe?g|png|webp)$/.test(safe)) throw new Error('Only JPG, PNG or WEBP images can be uploaded');
            const dir = path.join(root, 'public/media/uploads');
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, safe), body);
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, path: `media/uploads/${safe}` }));
            return;
          }
          next();
        } catch (e) {
          res.statusCode = 400;
          res.end(JSON.stringify({ ok: false, error: (e as Error).message }));
        }
      });
    },
  };
}
