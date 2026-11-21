import {test} from 'node:test';
import assert from 'node:assert/strict';
import {threads,step,buffer,transfer,banker,disk,raid} from '../src/simulation.mjs';
test('interleaved increments lose an update',()=>{const s=threads();for(const i of [0,1,0,1,0,1])step(s,i,'counter');assert.equal(s.value,1);});
test('split check admits both; atomic claims admit only one',()=>{for(const mode of ['split','tas','cas']){const s=threads();for(const i of mode==='split'?[0,1,0,1]:[0,1])step(s,i,mode);assert.deepEqual(s.pc,mode==='split'?[2,2]:[2,0]);}});
test('buffer wraps; mutex-first empty read blocks its producer',()=>{const s=buffer();for(let i=0;i<3;i++){transfer(s,true,false);transfer(s,false,false);}assert.equal(s.fill,0);transfer(s,false,true);transfer(s,true,true);assert.equal(s.stuck,true);assert.equal(s.count,0);});
test('banker accepts P3 but refuses P4',()=>{assert.deepEqual(banker(3).done.map(r=>r[4]),[4,5,6,10]);assert.equal(banker(4).safe,false);});
test('disk example reproduces the study charts',()=>{assert.deepEqual(disk([98,183,37,122,14,124,65,67],53,'down').map(t=>t.total),[640,236,208,236,326,386]);});
test('RAID layouts tolerate different failure pairs',()=>{assert.deepEqual(raid([true,false,true,false]),{mirrorOfStripes:false,stripeOfMirrors:true});assert.deepEqual(raid([true,true,false,false]),{mirrorOfStripes:true,stripeOfMirrors:false});});
