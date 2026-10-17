// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
const pages = process.env.GITHUB_PAGES === 'true';
const pagesRepo = process.env.PAGES_REPO || 'bahtepoto';
const pagesOwner = process.env.GITHUB_REPOSITORY_OWNER || 'bahtepp';

export default defineConfig({
  // Alan adı bağlanana kadar GitHub Pages proje adresi. Yerelde kök dizin.
  site: pages ? `https://${pagesOwner}.github.io` : 'https://bahtepoto.com',
  base: pages ? `/${pagesRepo}` : '/',

  // Tamamen statik çıktı (dist/). Sunucu gerektirmez.
  output: 'static',

  // URL biçimini tek tip tutar: /hakkinda/ (GitHub Pages ile uyumlu).
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },

  // Geliştirme sunucusu: http://localhost:4321
  server: {
    port: 4321,
    host: false,
  },
});
