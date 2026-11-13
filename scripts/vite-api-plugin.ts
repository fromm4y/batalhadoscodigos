import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

/**
 * Só no `npm run dev`: executa as funções de `api/*.ts` dentro do servidor do Vite,
 * imitando a Vercel (req.body em JSON, res.status().json()). Não entra no build.
 */
export function vercelApiDev(): Plugin {
  return {
    name: 'cacada-vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', async (req: IncomingMessage, res: ServerResponse, next) => {
        const name = (req.url ?? '').split('?')[0]?.replace(/^\/+/, '');
        if (!name || !/^[a-z0-9-]+$/.test(name)) return next();
        let mod: { default?: (req: unknown, res: unknown) => Promise<void> };
        try {
          mod = (await server.ssrLoadModule(`/api/${name}.ts`)) as typeof mod;
        } catch {
          return next();
        }
        if (!mod.default) return next();

        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const raw = Buffer.concat(chunks).toString('utf8');
        let body: unknown = raw;
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          /* mantém texto */
        }

        const vReq = Object.assign(req, { body });
        const vRes = Object.assign(res, {
          status(code: number) {
            res.statusCode = code;
            return vRes;
          },
          json(data: unknown) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          },
        });
        try {
          await mod.default(vReq, vRes);
        } catch (err) {
          console.error(`[api/${name}]`, err);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.end(JSON.stringify({ ok: false, error: 'Erro interno (dev).' }));
          }
        }
      });
    },
  };
}
