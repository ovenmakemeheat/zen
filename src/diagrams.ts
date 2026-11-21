const blocks = [...document.querySelectorAll<HTMLElement>('article pre > code.language-mermaid')];
async function draw() {
 if (!blocks.length) return;
 const {default: mermaid} = await import('mermaid');
 mermaid.initialize({startOnLoad:false, securityLevel:'strict', suppressErrorRendering:true, theme:'base', htmlLabels:false,
  themeVariables:{fontFamily:'Georgia, serif',primaryColor:'#f2e5bc',primaryTextColor:'#282828',primaryBorderColor:'#87580c',lineColor:'#665c54',secondaryColor:'#e1e8d4',tertiaryColor:'#fbf1c7'}});
 for (const [i, code] of blocks.entries()) {
  try {
   const {svg} = await mermaid.render(`zen-diagram-${i}`,code.textContent ?? '');
   const frame = document.createElement('figure');
   frame.className = 'study-diagram';
   frame.innerHTML = svg;
   code.parentElement?.replaceWith(frame);
  } catch (error) { console.warn('Could not render lesson diagram',error); }
 }
}
void draw().catch(error => console.warn('Could not load lesson diagrams',error));
