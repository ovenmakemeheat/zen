const blocks = [...document.querySelectorAll<HTMLElement>('article pre > code.language-mermaid')];
async function draw() {
 if (!blocks.length) return;
 const {default: mermaid} = await import('mermaid');
 mermaid.initialize({startOnLoad:false, securityLevel:'strict', suppressErrorRendering:true, theme:'base', htmlLabels:false,
  themeVariables:{fontFamily:'Georgia, serif',darkMode:false,background:'#fbf1c7',primaryColor:'#f2e5bc',primaryTextColor:'#282828',primaryBorderColor:'#665c54',lineColor:'#504945',textColor:'#282828',secondaryColor:'#e1e8d4',tertiaryColor:'#fbf1c7',edgeLabelBackground:'#fbf1c7',actorBkg:'#f2e5bc',actorBorder:'#665c54',actorTextColor:'#282828',actorLineColor:'#504945',signalColor:'#504945',signalTextColor:'#282828',labelBoxBkgColor:'#f2e5bc',labelTextColor:'#282828',noteBkgColor:'#ebdbb2',noteBorderColor:'#665c54',noteTextColor:'#282828'}});
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
