import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await page.waitForFunction(()=>document.querySelectorAll('.game-card').length>0);
 const total=await page.locator('.game-card').count();
 assert.ok(total>=30,'catalog unexpectedly small: '+total);
 const done=Number(await page.locator('#stage-count-done').innerText());
 assert.ok(done>0,'DONE group must not be empty');
 await page.locator('[data-stage="done"]').click();
 await page.waitForFunction(()=>document.querySelectorAll('.game-card').length>0);
 assert.ok((await page.locator('.game-card').count())<=done,'stage filter exceeded DONE count');
 await page.locator('[data-stage="all"]').click();
 await page.locator('#search-input').fill('un-jeu-qui-n-existe-pas-qa-000');
 await page.locator('#no-results').waitFor({state:'visible'});
 assert.equal(await page.locator('.game-card').count(),0,'unknown search must have no cards');
 await page.locator('#clear-search').click();
 await page.waitForFunction(()=>document.querySelectorAll('.game-card').length>0);
 assert.deepEqual(errors,[],'catalog JavaScript errors');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.goto('http://127.0.0.1:8765/',{waitUntil:'load'});
 await mobile.waitForFunction(()=>document.querySelectorAll('.game-card').length>0);
 assert.ok(await mobile.locator('#search-input').isVisible());
 await mobile.close();
 console.log('PASS: catalog filters, search reset and mobile listing; '+total+' games');
}finally{await browser.close()}
