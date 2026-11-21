# zen

A static Astro study library. Its first subject is CPE333 Operating Systems, with lessons 7–12. The homepage groups lessons by subject and lets you search or filter by tag. From this directory, run `npm ci` and `npm run dev`. To verify the production output, run `npm run build` followed by `npm test`. Serve `dist/` on a static host or use `npm run preview` locally.

## Author a lesson

Copy a file in `content/`, such as `lecture-7.md`, and edit its Markdown body and YAML frontmatter. The filename determines the URL. Use a unique filename for the route and a numeric `id` to order lessons within a subject. Set `subject: { code, title }` and `tags` to categorize it in the library. Set `source` to the PDF filename if there is an accompanying deck. The frontmatter holds section slide ranges, the visual lab's nodes and step frames, and quiz prompts, answer choices and feedback. `answer` and `focus` are zero-based; slide references start at 1. Each frame lists one state per node, in the same order as the nodes.

Put the corresponding `<id>.pdf` in `public/sources/` and run `npm run sources` with `pdftotext` and `pdftoppm` on PATH to regenerate searchable text and previews. The original PDF is authoritative for image-only content and text extraction mistakes. Ordinary builds do not require the PDF tools.

Add diagrams with a `mermaid` fenced code block in the lesson body. They render as SVG in the site and stay editable in the Markdown download.

The Markdown download includes frontmatter (including quiz answers), not the original slide assets. Print / PDF prints the guided notes, visual frames and quiz. Use Download lecture PDF for the complete deck; there is no inline slide library. Older CPE333 HTML artifacts are unchanged.
