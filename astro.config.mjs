import { defineConfig } from 'astro/config';

// Keep Mermaid fences as plain text for the client renderer.
export default defineConfig({ markdown: { syntaxHighlight: false } });
