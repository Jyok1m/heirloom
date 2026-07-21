import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

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

  return {
    plugins: [react(), tailwindcss()],
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
