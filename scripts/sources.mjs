import { execFileSync } from 'node:child_process';
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs';
const root = 'public/sources';
const index = {};
for (const file of readdirSync(root).filter(name => /^\d+\.pdf$/.test(name))) {
  const id = file.split('.')[0];
  const pdf = `${root}/${file}`;
  const pages = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdf, '-'], { encoding:'utf8' }).split('\f');
  if (!pages.pop()?.trim() && pages.length) {
    index[id] = pages.map((page,i) => ({n:i+1, text:page.trim(), title:page.trim().split(/\r?\n/)[0]?.trim() || `Slide ${i+1}`}));
  } else throw new Error(`Missing page boundaries in ${pdf}`);
  mkdirSync(`${root}/${id}`, {recursive:true});
  execFileSync('pdftoppm', ['-scale-to','1440','-jpeg','-jpegopt','quality=87',pdf,`${root}/${id}/slide`], {stdio:'inherit'});
}
writeFileSync('src/slides.json', JSON.stringify(index));
