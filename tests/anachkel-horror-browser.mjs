import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--disable-gpu','--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:750}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/DONE/_2D%20Anachkel%20Horror/index.html',{waitUntil:'domcontentloaded'});
 await page.locator('#start').click();
 const route=await page.evaluate(()=>anachkelRoute(12.5,11.5,1.7,1.7).map(p=>({x:p.x,y:p.y,blocked:wall(p.x,p.y)})));
 assert.ok(route.length>0,'enemy must find a route to the entrance');
 assert.ok(route.every(p=>!p.blocked),'path cannot pass through solid walls');
 await page.evaluate(()=>{S.flags.key=true;S.flags.diary=true;completeChapter()});
 assert.equal(await page.locator('#ending').evaluate(el=>el.classList.contains('show')),true);
 await page.locator('#ending-replay').click();
 assert.equal(await page.evaluate(()=>S.started),true,'replay must restart active gameplay');
 assert.equal(await page.locator('#ending').evaluate(el=>el.classList.contains('show')),false);
 await page.evaluate(()=>localStorage.setItem('warlike-anachkel-save',JSON.stringify({version:2,x:1.7,y:1.7,a:0,flags:{key:true,diary:false},hp:10000,ammo:500,reserve:3000,enemy:{x:999,y:999}})));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#load').click();
 assert.deepEqual(await page.evaluate(()=>({hp:S.hp,ammo:S.ammo,reserve:S.reserve,enemy:S.enemy})),{hp:100,ammo:7,reserve:999,enemy:{x:12.5,y:11.5}});
 assert.deepEqual(errors,[],'no JavaScript runtime exceptions');
 console.log('PASS Anachkel pathfinding, chapter completion, replay and save recovery');
}finally{await browser.close()}
