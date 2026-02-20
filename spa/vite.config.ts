import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error - no type declarations available
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

function phpTemplatePlugin(): Plugin {
  return {
    name: 'php-template',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === 'asset' && fileName.endsWith('.html')) {
          let html = chunk.source as string;

          // Escape any `<?` sequences in the bundled JS so PHP does not
          // interpret them as open tags (e.g. Prism grammar regexes).
          html = html.replace(/<\?/g, '<?= "<?" ?>');

          // Now inject intentional PHP template variables (these must
          // not be escaped, so we apply them after the blanket escape).
          html = html.replace(/"__ARCH_JSON_URL__"/g, '"<?= $archJsonUrl ?>"');
          html = html.replace(/"__ARCH_JSON_UPDATE_URL__"/g, '"<?= $archJsonUpdateUrl ?>"');
          html = html.replace(/"__OPENAPI_JSON_URL__"/g, '"<?= $openapiJsonUrl ?>"');
          html = html.replace(/"__OPENAPI_JSON_UPDATE_URL__"/g, '"<?= $openapiJsonUpdateUrl ?>"');
          html = html.replace(/"__DOCS_NAVIGATION_URL__"/g, '"<?= $docsNavigationUrl ?>"');

          const phpFileName = 'doc.html.php';
          this.emitFile({
            type: 'asset',
            fileName: phpFileName,
            source: html,
          });
          delete bundle[fileName];
        }
      }
    },
  };
}

export default defineConfig({
  root: resolve(__dirname),
  build: {
    outDir: resolve(__dirname, '../templates'),
    emptyOutDir: false,
    target: 'esnext',
  },
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
    phpTemplatePlugin(),
  ],
});
