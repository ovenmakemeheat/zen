export function threads() { return {value:0, pc:[0,0], reg:[null,null]}; }
export function step(s,i,mode) {
 const p=s.pc[i], r=s.reg, name='AB'[i];
 if(mode==='counter'){
  if(p===0) r[i]=s.value;
  if(p===1) r[i]++;
  if(p===2) s.value=r[i];
  if(p<3) s.pc[i]++;
  return `${name}: ${['loaded','added one','stored'][p]} ${r[i]}`;
 }
 if(mode==='split'&&p===1){s.value=1;s.pc[i]=2;return `${name} writes 1 and enters without rechecking`;}
 r[i]=s.value;
 if(mode==='tas'||(mode==='cas'&&!r[i]))s.value=1;
 if(!r[i])s.pc[i]=mode==='split'?1:2;
 return `${name} sees ${r[i]}: ${r[i] ? (mode==='tas'?'writes 1 again and waits':mode==='cas'?'no write; waits':'waits') : mode==='split'?'passed check, not yet inside':'claims lock and enters'}`;
}
export function buffer(){return {slots:[null,null,null],fill:0,use:0,count:0,next:1,stuck:false};}
export function transfer(s,put,wrong){
 if(s.stuck)return 'Deadlocked: the other side cannot take the mutex.';
 if(put?s.count===3:s.count===0){s.stuck=wrong;return wrong?'Deadlock: waiting for a permit while holding the mutex.':'Would block on permit; the mutex remains free.';}
 const k=put?'fill':'use',i=s[k],item=put?s.next++:s.slots[i];
 s.slots[i]=put?item:null;s.count+=put?1:-1;s[k]=(i+1)%3;
 return `${put?'Produced':'Consumed'} item ${item} at slot ${i}.`;
}
export function banker(grant){
 const a=[1,1,2,4],max=[6,5,4,7],done=[];let work=2;
 if(grant){a[grant-1]++;work--;}
 const initial=work,need=max.map((m,i)=>m-a[i]);
 while(true){const i=need.findIndex((n,i)=>n<=work&&!done.some(row=>row[0]===i+1));if(i<0)break;
 done.push([i+1,work,need[i],a[i],work+a[i]]);work+=a[i];}
 return {initial,need,done,safe:done.length===4};
}
export function disk(queue,head,direction){
 const sorted=[...queue].sort((a,b)=>a-b),down=direction==='down';
 const same=down?sorted.filter(n=>n<=head).reverse():sorted.filter(n=>n>=head);
 const other=down?sorted.filter(n=>n>head):sorted.filter(n=>n<head).reverse();
 const nearest=[],left=[...queue];let current=head;
 while(left.length){let j=0;for(let i=1;i<left.length;i++)if(Math.abs(left[i]-current)<Math.abs(left[j]-current))j=i;current=left.splice(j,1)[0];nearest.push(current);}
 const end=down?0:199, opposite=199-end;
 return Object.entries({FCFS:queue,SSTF:nearest,LOOK:[...same,...other],SCAN:[...same,...(other.length?[end]:[]),...other],'C-LOOK':[...same,...other.slice().reverse()],'C-SCAN':[...same,...(other.length?[end,opposite]:[]),...other.slice().reverse()]}).map(([label,stops])=>({label,stops:[head,...stops],total:stops.reduce((sum,n,i)=>sum+Math.abs(n-(i?stops[i-1]:head)),0)}));
}
export function raid(failed){const [a,b,c,d]=failed;return {mirrorOfStripes:(!a&&!b)||(!c&&!d),stripeOfMirrors:(!a||!b)&&(!c||!d)};}
