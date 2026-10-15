const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/tyran/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve('nextstep-web/dist'),checks=[],errors=[];
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
 for(const width of [320,390,1280]){
  const context=await browser.newContext({timezoneId:'Asia/Shanghai',viewport:{width,height:width===320?568:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  const verify=async(name,fn)=>{assert.equal(await fn(),true,name);checks.push({name:name+' '+width,passed:true})};
  const click=async(action,value)=>page.locator('#nutrition-dialog [data-nut-action="'+action+'"]'+(value?'[data-value="'+value+'"]':'')).first().click();
  const bounds=()=>page.evaluate(()=>{const d=document.getElementById('nutrition-dialog');return document.documentElement.scrollWidth<=innerWidth&&d.scrollWidth<=d.clientWidth});
  await page.goto('http://127.0.0.1:'+server.address().port+'/#nutrition');
  await page.locator('#app [data-nut-action="meal-new"]').first().click();
  await verify('Fresh user opens icon search without injected records',()=>page.evaluate(()=>mealEditor.picker==='search'&&nutrition.meals.length===0&&foodCatalog.length===134));
  await verify('Default classification layout has no overflow',bounds);
  await page.screenshot({path:path.join(__dirname,'place-'+width+'.png')});
  for(const [axis,values]of [['place',['restaurant','home','fridge','cupboard']],['kind',['fruit','meat','vegetable','staple','dairy','snacks','drink','custom']],['time',['breakfast','lunch','dinner','night']]]){
   if(axis!=='place')await click('browse-axis',axis);
   for(const value of values){
    await click('browse-filter',value);
    await verify(axis+'/'+value+' filters visible rows and keeps button focus',()=>page.evaluate(value=>{const selected=document.querySelector('[data-nut-action="browse-filter"][data-value="'+value+'"]'),rows=[...document.querySelectorAll('#nutrition-picker-results [data-nut-action="food-add"]')].map(b=>b.dataset.id),expected=nFoodList(mealEditor.query,mealEditor.category,value).map(f=>f.id);return selected.getAttribute('aria-pressed')==='true'&&document.activeElement===selected&&JSON.stringify(rows)===JSON.stringify(expected)},value));
    await verify(axis+'/'+value+' has no overflow',bounds);
   }
   if(axis==='kind')await page.screenshot({path:path.join(__dirname,'kind-'+width+'.png')});
  }
  await click('browse-axis','kind');await click('browse-filter','fruit');
  await page.locator('#nutrition-search').fill('西瓜');
  await verify('Keyword intersects fruit and live result count is correct',()=>page.locator('#nutrition-picker-results [data-nut-action="food-add"]').count().then(n=>n===1));
  await page.screenshot({path:path.join(__dirname,'fruit-search-'+width+'.png')});
  await page.locator('[data-nut-action="food-add"][data-id="watermelon"]').click();await click('meal-next');
  await page.locator('#meal-qty-0').fill('180');await page.locator('#meal-name').fill('水果加餐');await click('meal-back');
  await verify('Back preserves food quantity, query and category',()=>page.evaluate(()=>mealEditor.items[0].quantity===180&&mealEditor.browse==='fruit'&&mealEditor.query==='西瓜'));
  await click('browse-clear');await verify('Clear restores all foods and focus',()=>page.evaluate(()=>mealEditor.query===''&&mealEditor.browse===''&&document.activeElement.dataset.nutAction==='browse-clear'));
  await click('browse-axis','place');await click('browse-filter','cupboard');await page.locator('#nutrition-search').fill('核桃');await page.locator('[data-nut-action="food-add"][data-id="walnut"]').click();
  await click('meal-next');await verify('Parameters have no overflow',bounds);await page.screenshot({path:path.join(__dirname,'params-'+width+'.png')});
  await click('meal-back');await page.waitForTimeout(450);await page.reload();await page.locator('#app [data-nut-action="meal-new"]').first().click();await click('meal-resume');
  await verify('Reload restores browse state and quantities',()=>page.evaluate(()=>mealEditor.browse==='cupboard'&&mealEditor.query==='核桃'&&mealEditor.items.length===2&&mealEditor.items[0].quantity===180));
  await click('meal-next');await page.locator('#nutrition-meal-form [type="submit"]').click();await page.locator('#nutrition-dialog').waitFor({state:'hidden'});
  await verify('Saved meal contains 180g watermelon and 20g walnuts exactly once',()=>page.evaluate(()=>nutrition.meals.length===1&&Math.abs(nutritionDay(nutritionDate).known-184.8)<1e-7));
  await page.locator('#app [data-nut-action="meal-detail"]').first().click();await click('meal-edit');await verify('Edit retains saved quantities',()=>page.locator('#meal-qty-0').inputValue().then(v=>v==='180'));await verify('Edit has no overflow',bounds);
  await context.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'browser-checks.json'),JSON.stringify({checks,errors},null,2)+'\n');console.log(checks.length+' browser checks passed');
 }finally{await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exit(1)});
