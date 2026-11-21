# zen — agent guide

These instructions apply to `zen/`. This is a static Astro study library. Its first subject is CPE333 Operating Systems, currently covering lectures 7–12. Keep other Homework artifacts and the original lecture files untouched unless asked.

## Develop and verify

Run commands from `zen/`:

- `npm ci` — install locked dependencies.
- `npm run dev` — local development.
- `npm run build && npm test` — build and run the content and simulation tests. Build first: the content tests inspect `dist/`.
- `npm run preview` — inspect the production build. For visual changes, check the affected pages at desktop and mobile widths, including whether Mermaid diagrams actually render and simulator controls work.

## Lessons and sources

- Author lessons in `content/lecture-*.md` using Markdown and YAML frontmatter. Use a unique filename for the route, a numeric `id` for ordering within the subject, `subject: { code, title }` for grouping, and `tags` for filtering. The optional `source` names a PDF in `public/sources/`. The schema is in `src/content.config.ts`. Quiz `answer` and lab `focus` are zero-based; PDF page references are one-based. Keep lab frame states in node order.
- Read both the PDF text and the rendered slide visuals before revising coverage. Figures, timelines, code screenshots, and annotations can contain details missing from extracted text. Check worked examples against the actual figure and flag discrepancies rather than silently repeating a caption. Distinguish lecture coverage from predictions about the exam.
- Keep PDFs downloadable without restoring an inline slide library. `npm run sources` regenerates extracted text and previews using `pdftotext` and `pdftoppm`; ordinary builds do not need these tools.
- Replace hard-to-follow procedural prose with a timeline, state table, Mermaid diagram, or worked example beside the relevant explanation. Use native Astro/SVG components when an interaction or shared visual scale makes the concept clearer. Keep key terms highlighted inline with subtle `<mark>` styling, not bright blocks or numbered eyebrow labels.

## Architecture and UI conventions

- `src/pages/index.astro` is the library homepage, and `src/pages/[lecture].astro` is the shared lecture page. Keep the responsive, centered single-column layout, theme switch, previous/next navigation, Markdown export with frontmatter, print layout, and PDF download. Don't bring back the lecture sidebar or index without a request.
- Preserve the piang-note-inspired Gruvbox light/dark palette and serif typography through the tokens in `src/style.css`. Use readable labels and text alternatives; don't communicate state by color alone. Check keyboard interaction and avoid page-level overflow on mobile.
- Mermaid fences stay editable in Markdown and are rendered by `src/diagrams.ts`. Simulator markup lives in `src/components/Simulator.astro`, browser controls in `src/sim-ui.mjs`, and deterministic models in `src/simulation.mjs`. Keep model logic separate from the DOM; add or update outcome tests in `scripts/simulation.test.mjs` when behavior changes.
