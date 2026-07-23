// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// PUBLIC_URL is the canonical site origin, used for sitemap/canonical/OG.
// GitHub and demo targets are overridable per-environment (see .env.example).
const site = process.env.PUBLIC_URL || 'https://heirloom-app.com';
const github = process.env.PUBLIC_GITHUB_URL || 'https://github.com/Jyok1m/heirloom';

// https://astro.build/config
export default defineConfig({
  site,
  integrations: [
    starlight({
      title: 'Heirloom',
      description:
        'Open source, self-hosted family tree. Your family data stays on your own machine.',
      logo: { src: './src/assets/heirloom-mark.svg', replacesTitle: false },
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'GitHub', href: github }],
      customCss: ['./src/styles/global-fonts.css', './src/styles/docs.css'],
      head: [
        { tag: 'meta', attrs: { name: 'theme-color', content: '#faf7f0', media: '(prefers-color-scheme: light)' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#1c1917', media: '(prefers-color-scheme: dark)' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
        { tag: 'link', attrs: { rel: 'mask-icon', href: '/favicon.svg', color: '#d97706' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.webmanifest' } },
        { tag: 'meta', attrs: { property: 'og:image', content: `${site}/og-image.png` } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${site}/og-image.png` } },
      ],
      // Docs live under /docs/* (content nested in src/content/docs/docs/).
      // The site root (/) and /demo are custom marketing pages in src/pages/.
      sidebar: [
        {
          label: 'Documentation',
          items: [
            { label: 'Overview', slug: 'docs' },
            { label: 'Local development', slug: 'docs/getting-started' },
            { label: 'Self-hosting with Docker', slug: 'docs/self-hosting' },
            { label: 'Configuration', slug: 'docs/configuration' },
          ],
        },
      ],
    }),
  ],
});
