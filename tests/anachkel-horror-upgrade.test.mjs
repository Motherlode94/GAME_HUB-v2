import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const path=new URL('../DONE/_2D Anachkel Horror/index.html',import.meta.url);
const html=await readFile(path,'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('Anachkel HTML contains valid JavaScript and a real chapter conclusion',()=>{
 assert.ok(script?.length>5000);
 assert.doesNotThrow(()=>new vm.Script(script,{filename:'anachkel-game.js'}));
 for(const id of ['ending','ending-replay','ending-menu','ending-summary'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(script,/function completeChapter\(\)/);
});
test('Anachkel navigation uses actual walkable tiles and route invalidation',()=>{
 assert.match(script,/function anachkelRoute\(/);
 assert.match(script,/previous\.set\(k,\[x,y\]\)/);
 assert.match(script,/anachkelRouteClock/);
 assert.match(script,/resetAnachkelRoute/);
});
test('Anachkel validates old save payloads and bounds health and ammunition',()=>{
 assert.match(script,/\[undefined,2\]\.includes\(a\.version\)/);
 assert.match(script,/safe\.ammo=cl\(/);
 assert.match(script,/safe\.hp=cl\(/);
 assert.match(script,/safe\.hidden=Boolean\(a\.hidden\)/);
});
