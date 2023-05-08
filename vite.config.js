import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import DefineOptions from 'unplugin-vue-define-options/vite'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import vuetify from 'vite-plugin-vuetify'

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }
  const port = 5173

  return defineConfig({
    plugins: [
      vue(),
      vueJsx(),
      vuetify({
        styles: {
          configFile: 'src/styles/variables/index.scss',
        },
      }),
      Pages({}),
      Layouts(),
      Components({
        dts: 'src/components.d.ts',
        dirs: ['src/@core/components', 'src/components', 'src/views'],
      }),
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', 'vue-i18n'],
        dts: 'src/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
        },
        vueTemplate: true,
      }),
      DefineOptions(),
    ],
    resolve: {
      alias: {
        '~': fileURLToPath(new URL('./src', import.meta.url)),
        '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
        '@configured-variables': fileURLToPath(
          new URL('./src/styles/variables/_template.scss', import.meta.url),
        ),
      },
    },
    server: {
      hmr: { clientPort: port, port },
      host: '0.0.0.0',
      strictPort: true,
      port,
      proxy: {
        '/api': {
          target: `${process.env.VITE_APP_API_URL}/snapshots/get`,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 5000,
    },
    optimizeDeps: {
      exclude: ['vuetify'],
      entries: ['./src/**/*.vue'],
    },
  })
}
