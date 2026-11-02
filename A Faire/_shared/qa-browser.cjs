// Vérification navigateur : node DONE/_shared/qa-browser.cjs
// Nécessite: npm install --no-save playwright ; un serveur HTTP local pour le dépôt.
const fs=require('node:fs'),path=require('node:path');
async function main(){
 let chromium;
 try{({chromium}=require('playwright'))}catch{console.error('Playwright absent : npm install --no-save playwright && npx playwright install chromium');process.exitCode=2;return}
 const base=process.env.WARLIKE_BASE_URL||'http://127.0.0.1:8000';
 const root=path.resolve(__dirname,'..');
 const dirs=fs.readdirSync(root,{withFileTypes:true}).filter(d=>d.isDirectory()&&d.name!=='_shared'&&fs.existsSync(path.join(root,d.name,'index.html'))).map(d=>d.name);
 const browser=await chromium.launch({headless:true});
 let failures=0,success=0;
 try{
  for(const dir of dirs){
   const page=await browser.newPage({viewport:{width:1280,height:800}});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const url=base+'/DONE/'+encodeURIComponent(dir)+'/index.html';
   try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:18000});
    await page.waitForTimeout(1600);
    const visible=await page.locator('body').isVisible();
    if(!response||!response.ok()||!visible||errors.length){failures++;console.error('FAIL '+dir+': HTTP '+(response?.status()??'—')+'; '+errors.join(' | '))}
    else{success++;console.log('OK   '+dir+' (chargement initial)')}
   }catch(error){failures++;console.error('FAIL '+dir+': '+error.message)}
   finally{await page.close()}
  }
 }finally{await browser.close()}
 console.log('Navigateur : '+success+' chargements initiaux OK, '+failures+' échecs / '+dirs.length+' jeux');
 console.log('Ce contrôle ne valide ni les conditions de victoire, ni les sauvegardes, ni le gameplay complet.');
 if(failures)process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1});
