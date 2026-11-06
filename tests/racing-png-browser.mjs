import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:800,height:800}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{
   window.__pngDraws=0;
   const original=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
     if(image instanceof HTMLImageElement&&image.src.includes('/assets/Racing/'))window.__pngDraws++;
     return original.call(this,image,...args);
   };
 });
 await page.goto('http://127.0.0.1:8765/A%20Faire/_2D%20Racing/index.html',{waitUntil:'load'});
 await page.waitForFunction(()=>typeof assetsLoaded!=='undefined'&&assetsLoaded,{timeout:25000});
 const state=await page.evaluate(()=>({
   total:assets.total,loaded:assets.loaded,
   road:!!assets.get('road')?.naturalWidth,
   grass:!!assets.get('bg_grass')?.naturalWidth,
   cars:['car_red','car_blue','car_yellow','car_lime','car_purple'].every(k=>!!assets.get(k)?.naturalWidth),
   props:['prop.barrel','prop.oil'].every(k=>!!assets.get(k)?.naturalWidth)
 }));
 assert.equal(state.loaded,state.total,'Assets have not finished loading');
 assert.equal(state.road,true,'Road PNG missing in game');
 assert.equal(state.grass,true,'Grass PNG missing in game');
 assert.equal(state.cars,true,'Car PNG missing in game');
 assert.equal(state.props,true,'Prop PNG missing in game');
 await page.waitForFunction(()=>window.__pngDraws>20,{timeout:10000});
 const originalSkin=await page.evaluate(()=>currentSkin);
 await page.keyboard.press('s');
 assert.notEqual(await page.evaluate(()=>currentSkin),originalSkin,'Skin switch must be interactive');
 assert.deepEqual(errors,[],'Unexpected racing runtime errors');
 console.log('PASS: all Racing car, road, grass and prop sprites loaded and drawn');
}finally{await browser.close()}
