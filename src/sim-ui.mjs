import {threads,step,buffer,transfer,banker,disk,raid} from './simulation.mjs';
const root=document.querySelector('[data-sim]');
if(root) mount(root);
function mount(root){
 const id=Number(root.dataset.sim), get=s=>root.querySelector(s), board=get('[data-board]'), status=get('[data-status]');
 const mode=()=>get('[data-mode]')?.value ?? 'counter';
 let t=threads(), b=buffer();
 // Markup below interpolates only model numbers, fixed labels and validated paths.
 const cards=items=>`<div class="sim-cards">${items.map(([name,value])=>`<div><small>${name}</small><strong>${value}</strong></div>`).join('')}</div>`;
 function draw(message=''){
  if(id<=8){
   const limit=id===7?3:2;
   board.innerHTML=cards([['Shared '+(id===7?'counter':'flag'),t.value],...t.pc.map((p,i)=>[`Thread ${'AB'[i]}`,id===7?`Register ${t.reg[i]??'—'} · ${['load next','add next','store next','done'][p]}`:p===2?'Inside':p===1?'Write pending':t.reg[i]===1?'Waiting':'Ready to check'])]);
   t.pc.forEach((p,i)=>get(`[data-action="${i}"]`).disabled=p>=limit);
   if(t.pc.every(p=>p>=limit)) message+=id===7?` Final counter: ${t.value}; expected 2.`:' Both threads are inside: mutual exclusion failed.';
  }else if(id===9){
   board.innerHTML=cards(b.slots.map((item,i)=>[`Slot ${i}${b.fill===i?' · fill':''}${b.use===i?' · use':''}`,item??'Empty']))+cards([['empty permits',3-b.count],['full permits',b.count],['Mutex',b.stuck?'Held by blocked thread':'Free']]);
  }else if(id===10){
   const item=banker(Number(mode()));
   message=`${item.safe?'Safe':'Unsafe'} · initial Work = ${item.initial} · Need = [${item.need.join(', ')}].`;
   board.innerHTML=item.done.length?`<div class="sim-scroll"><table><thead><tr>${['Process','Work before','Need','Released','Work after'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${item.done.map(([p,...row])=>`<tr><th scope="row">P${p}</th>${row.map(n=>`<td>${n}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'No process has Need ≤ Work.';
  }else if(id===12){
   const failures=[...root.querySelectorAll('[data-drive]')].map(input=>input.checked), outcome=raid(failures);
   const groups=label=>[0,2].map(start=>[`${label} ${start/2+1}`,[start,start+1].map(i=>`D${i}: ${failures[i]?'failed':'online'}`).join(' · ')]);
   board.innerHTML=`<h3>RAID 0+1 · ${outcome.mirrorOfStripes?'Survives':'Unavailable'}</h3>${cards(groups('Stripe set'))}<h3>RAID 1+0 · ${outcome.stripeOfMirrors?'Survives':'Unavailable'}</h3>${cards(groups('Mirror pair'))}`;
   message=`RAID 0+1 ${outcome.mirrorOfStripes?'survives':'fails'}; RAID 1+0 ${outcome.stripeOfMirrors?'survives':'fails'}.`;
  }
  status.textContent=message;
 }
 const form=get('form');
 if(form){
  const plot=()=>{
   const data=new FormData(form), raw=String(data.get('queue')).split(',').map(s=>s.trim()), head=Number(data.get('head'));
   if(raw.length>30||!raw.every(n=>/^\d{1,3}$/.test(n)&&Number(n)<=199)||!Number.isInteger(head)||head<0||head>199){status.textContent='Enter up to 30 comma-separated cylinders from 0 to 199.';return;}
   const traces=disk(raw.map(Number),head,data.get('direction'));
   const x=n=>20+n/199*260,y=(i,length)=>16+i/(length-1)*90;
   board.innerHTML=`<div class="sim-cards">${traces.map(({label,stops,total})=>`<figure><figcaption>${label} · ${total} cylinders</figcaption><svg viewBox="0 0 300 120" role="img" aria-label="${label}: ${stops.join(' to ')}"><path d="M20 8V110 M280 8V110" class="sim-axis"/><polyline points="${stops.map((n,i)=>`${x(n)},${y(i,stops.length)}`).join(' ')}"/></svg><small>${stops.join(' → ')}</small></figure>`).join('')}</div>`;
   status.textContent='Cylinder 0 is on the left, 199 on the right. Read downward in time. Wrap travel counts.';
  };
  form.addEventListener('submit',event=>{event.preventDefault();plot();});plot();return;
 }
 function reset(){t=threads();b=buffer();root.querySelectorAll('[data-drive]').forEach(input=>input.checked=false);draw();}
 root.addEventListener('change',event=>event.target.matches('[data-mode]')?reset():draw());
 root.addEventListener('click',event=>{
  const action=event.target.closest('[data-action]')?.dataset.action;
  if(action===undefined)return;
  if(action==='reset'){reset();return;}
  if(id<=8)draw(step(t,Number(action),mode()));
  if(id===9)draw(transfer(b,action==='put',mode()==='wrong'));
 });
 draw();
}
