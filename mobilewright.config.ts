import { defineConfig } from 'mobilewright';

export default defineConfig({
  testDir: "./tests",
  platform: "android",
  reporter: [['html', { open: 'never' }]],
});
