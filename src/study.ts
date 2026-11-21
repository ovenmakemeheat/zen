const get = <T extends HTMLElement>(selector:string) => document.querySelector<T>(selector)!;
get('#theme').onclick = () => {
 const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
 document.documentElement.dataset.theme = theme;
 try { localStorage.setItem('os-theme',theme); } catch {}
};
get('#print').onclick = () => window.print();
const download = get<HTMLAnchorElement>('#markdown');
const markdown = get<HTMLTemplateElement>('#study-source').content.textContent ?? '';
download.href = URL.createObjectURL(new Blob([markdown],{type:'text/markdown;charset=utf-8'}));
const frames = [...document.querySelectorAll<HTMLElement>('[data-frame]')];
const back = get<HTMLButtonElement>('[data-step="-1"]');
const next = get<HTMLButtonElement>('[data-step="1"]');
let step = 0;
function move(delta:number){
 step = Math.max(0,Math.min(step+delta,frames.length-1));
 frames.forEach((frame,i)=>frame.hidden=i!==step);
 back.disabled=step===0; next.disabled=step===frames.length-1;
 if(delta>0 && next.disabled) back.focus();
 if(delta<0 && back.disabled) next.focus();
 get('[data-announcement]').textContent=`Step ${step+1}. ${frames[step].querySelector('.caption')?.textContent}`;
}
back.onclick=()=>move(-1); next.onclick=()=>move(1); next.disabled=frames.length<2;
const quiz = get<HTMLFormElement>('#quiz');
const questions = [...quiz.querySelectorAll('fieldset')];
function clear(){
 questions.forEach(q=>q.querySelector<HTMLElement>('.feedback')!.hidden=true);
 get('#score').textContent='';
}
quiz.addEventListener('change',clear);
quiz.addEventListener('reset',clear);
quiz.addEventListener('submit',event=>{
 event.preventDefault(); let total=0;
 for(const q of questions){
 const correct=q.querySelector<HTMLInputElement>('input:checked')?.value===q.dataset.answer;
 total+=Number(correct);
 const feedback=q.querySelector<HTMLElement>('.feedback')!;
 feedback.hidden=false;
 feedback.querySelector('strong')!.textContent=correct?'Correct.':'Not quite.';
 }
 get('#score').textContent=`${total} / ${questions.length} correct`;
});
