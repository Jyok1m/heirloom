import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Root .env, shared by the whole monorepo. Only VITE_-prefixed vars reach client code.
  const envDir = '../..';
  const env = loadEnv(mode, envDir, '');
  const backendUrl = env.BACKEND_URL ?? 'http://localhost:3000';

  return {
    plugins: [react()],
    envDir,
    server: {
      port: Number(env.FRONTEND_PORT ?? 5173),
      proxy: {
        '/api': backendUrl,
        '/graphql': backendUrl,
      },
    },
  };
});
