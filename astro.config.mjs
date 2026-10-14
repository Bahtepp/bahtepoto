// @ts-check
import { defineConfig } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  // Kanonik adres. Özel alan adı (bahtepoto.com) GitHub Pages'e bağlandığında
  // site kök dizinden yayınlanacağı için `base` ayarına gerek yoktur.
  site: 'https://bahtepoto.com',

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
