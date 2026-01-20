// manifest.config.ts
import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'DMM Download Helper',
  version: packageJson.version,
  description: 'Download your dmm video easily',
  permissions: [
    'storage'
  ],
  host_permissions: [
    'https://*.dmm.co.jp/*',
    'https://*.dmm.com/*'
  ],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  content_scripts: [
    {
      matches: [
        'https://*.dmm.co.jp/*',
        'https://*.dmm.com/*'
      ],
      js: ['src/content/index.ts'],
      run_at: 'document_start'
    }
  ],
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'DMM Download Helper'
  },
  web_accessible_resources: [
    {
      resources: ['injected.js'],
      matches: [
        'https://*.dmm.co.jp/*',
        'https://*.dmm.com/*'
      ]
    }
  ],
  icons: {
    '16': 'public/logo-16.png',
    '48': 'public/logo-48.png',
    '128': 'public/logo-128.png'
  }
});