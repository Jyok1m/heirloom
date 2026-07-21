import { defineConfig, loadEnv, type Plugin, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// SEO: substitute {{SITE_URL}} in index.html and emit robots.txt + sitemap.xml
// with the deployment URL (PUBLIC_URL, falling back to FRONTEND_URL).
function seoPlugin(siteUrl: string): Plugin {
  const publicRoutes = ['/', '/login', '/signup'];
  return {
    name: 'heirloom-seo',
    transformIndexHtml(html) {
      return html.replaceAll('{{SITE_URL}}', siteUrl);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source:
          'User-agent: *\nAllow: /\n' +
          (siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''),
      });
      const urls = publicRoutes
        .map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`)
        .join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source:
          '<?xml version="1.0" encoding="UTF-8"?>\n' +
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
          `${urls}\n</urlset>\n`,
      });
    },
  };
}

// Proxy to the API without Vite's noisy stack traces while NestJS is
// (re)starting: connection errors get a quiet one-liner and a 503 the
// frontend retries on; other proxy errors stay fully logged.
function apiProxy(target: string): ProxyOptions {
  return {
    target,
    configure(proxy) {
      const quiet = (
        err: NodeJS.ErrnoException,
        _req: unknown,
        res: { headersSent?: boolean; writableEnded?: boolean; writeHead?: Function; end?: Function; req?: { url?: string } },
      ) => {
        const connectionError =
          err.code === 'ECONNREFUSED' ||
          (err as { errors?: NodeJS.ErrnoException[] }).errors?.some(
            (e) => e.code === 'ECONNREFUSED',
          );
        if (connectionError) {
          console.log(`[vite] API not ready yet (${res.req?.url ?? '?'})`);
        } else {
          console.error(`[vite] proxy error: ${err.message}`);
        }
        if (res.writeHead && !res.headersSent && !res.writableEnded) {
          res.writeHead(503, { 'content-type': 'application/json' });
          res.end?.(JSON.stringify({ message: 'API starting' }));
        }
      };
      proxy.on('error', quiet);
      // Vite registers its verbose logger right after configure(): drop it
      setImmediate(() => {
        for (const listener of proxy.listeners('error')) {
          if (listener !== quiet) proxy.removeListener('error', listener as never);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Root .env, shared by the whole monorepo. Only VITE_-prefixed vars reach client code.
  const envDir = '../..';
  const env = loadEnv(mode, envDir, '');
  const backendUrl = env.BACKEND_URL ?? 'http://localhost:3000';
  // Absolute site URL for canonical/OG/sitemap. Self-hosters set PUBLIC_URL
  // to their domain; otherwise fall back to FRONTEND_URL (dev/local).
  // process.env wins so CI can inject it as a Docker build-arg (no .env in the image).
  // `||` (not `??`) so an empty string falls through to the next source.
  const siteUrl = (
    process.env.PUBLIC_URL ||
    env.PUBLIC_URL ||
    env.FRONTEND_URL ||
    ''
  ).replace(/\/$/, '');

  return {
    plugins: [react(), tailwindcss(), seoPlugin(siteUrl)],
    envDir,
    server: {
      port: Number(env.FRONTEND_PORT ?? 5173),
      proxy: {
        '/api': apiProxy(backendUrl),
        '/graphql': apiProxy(backendUrl),
      },
    },
  };
});
