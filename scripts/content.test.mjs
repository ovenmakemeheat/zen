import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('homepage lists the Operating Systems subject and links to all six lessons',()=>{
 const page=readFileSync('dist/index.html','utf8');
 assert.match(page,/<h1[^>]*>Study library<\/h1>/);
 assert.match(page,/data-group="CPE333"/);
 assert.match(page,/data-tag="Concurrency"/);
 for(let id=7;id<=12;id++)assert.ok(page.includes(`href="/lecture-${id}/"`));
});
const examples={7:'20,000,000',8:'setpark',9:'wrong-queue bug',10:'Banker',11:'208',12:'1,024'};
for(const [id,example] of Object.entries(examples)) test(`Lecture ${id}: study prep and PDF download`,()=>{
 const page=readFileSync(`dist/lecture-${id}/index.html`,'utf8');
 assert.equal(readFileSync(`dist/sources/${id}.pdf`).subarray(0,5).toString(),'%PDF-');
 assert.match(page,new RegExp(`href="/sources/${id}\\.pdf" download`));
 assert.match(page,/<template id="study-source">---/);
 assert.ok(page.includes(example));
 assert.match(page,/<code class="language-mermaid">/);
 assert.match(page,/<mark>[^<]+<\/mark>/);
 assert.equal([...page.matchAll(/<fieldset\b/g)].length,5);
 if(id==='11') assert.deepEqual([...page.matchAll(/<span\b[^>]*>(\d+) cylinders moved<\/span>/g)].map(m=>Number(m[1])),[640,236,208,236,386,326]);
 assert.doesNotMatch(page,/ORIGINAL MATERIAL|lecture-menu|id="slides"|\/ VISUAL LAB/);
});
