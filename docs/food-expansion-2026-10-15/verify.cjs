const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/tyran/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const root=path.resolve('nextstep-web/dist'),out=__dirname,checks=[],errors=[];
 const server=http.createServer((req,res)=>{const name=req.url.split('?')[0],file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}try{res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
  const context=await browser.newContext({timezoneId:'Asia/Shanghai',viewport:{width:390,height:844}});await context.addInitScript(()=>{const OriginalDate=Date,stamp=new OriginalDate('2026-10-15T12:00:00+08:00').getTime();window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[stamp]))}static now(){return stamp}}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port+'/#nutrition');
  const verify=async(name,fn)=>{let result;for(let i=0;i<20;i++){result=await fn();if(result===true)break;await new Promise(r=>setTimeout(r,100))}assert.equal(result,true,name);checks.push({name,passed:true});console.log('PASS',name)};
  const action=async(name)=>page.locator('#nutrition-dialog [data-nut-action="'+name+'"]').first().click();
  const shot=async(name)=>{await new Promise(r=>setTimeout(r,180));await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'})};
  const open=async()=>{await page.locator('#app [data-nut-action="meal-new"]').first().click();await action('combos')};
  const save=async()=>{await page.locator('#nutrition-meal-form [type="submit"]').click();await page.locator('#nutrition-dialog').waitFor({state:'hidden'})};
  await verify('95 foods and 20 combos load without seeding user data',()=>page.evaluate(()=>foodCatalog.length===95&&foodCombos.length===20&&nutrition.meals.length===0&&!localStorage.getItem('nextstep.nutrition')));
  await open();
  for(const width of [320,390,1280]){
   await page.setViewportSize({width,height:width===320?760:900});
   for(const [category,key]of [['老乡鸡','lxj'],['大米先生','dmxs'],['米村拌饭','micun'],['杨国福','ygf'],['麻辣香锅','dry-pot'],['沙拉','salad'],['披萨','pizza']]){
    await page.locator('#nutrition-combo-category').selectOption(category);
    await verify(category+' filtered combos and no overflow '+width,()=>page.evaluate(cat=>{const ids=Array.from(document.querySelectorAll('#nutrition-combo-results [data-id]'),b=>b.dataset.id),wanted=foodCombos.filter(c=>c.category===cat).map(c=>c.id);return JSON.stringify(ids)===JSON.stringify(wanted)&&document.documentElement.scrollWidth<=innerWidth&&document.getElementById('nutrition-dialog').scrollWidth<=document.getElementById('nutrition-dialog').clientWidth},category));
    if(width===390)await shot(key+'-combos-390');
   }
   await page.locator('#nutrition-combo-category').selectOption('米村拌饭');await page.locator('[data-nut-action="combo-add"][data-id="micun-beef-lunch"]').click();
   await verify('Included rice not duplicated '+width,()=>page.evaluate(()=>mealEditor.items.length===2&&Math.abs(nMealCalories(mealEditor).known-716.8)<1e-7));
   await page.locator('[data-nut-action="food-source"][data-index="0"]').click();await verify('Recipe provenance shows ingredients and distinguishes menu from calories '+width,()=>page.evaluate(()=>document.querySelectorAll('.n-recipe-source .n-row').length===7&&document.getElementById('nutrition-content').textContent.includes('不作为热量来源')&&document.getElementById('nutrition-dialog').scrollWidth<=document.getElementById('nutrition-dialog').clientWidth));await shot('recipe-source-'+width);
   await action('meal-params-return');await shot('micun-params-'+width);await action('close');await action('discard-draft');await page.locator('#nutrition-dialog').waitFor({state:'hidden'});await open();
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#nutrition-combo-category').selectOption('杨国福');await page.locator('[data-nut-action="combo-add"][data-id="ygf-custom-bowl"]').click();
  await verify('Mala bowl separates ingredients noodles and broth',()=>page.evaluate(()=>mealEditor.items.length===4&&Math.abs(nMealCalories(mealEditor).known-532.3)<1e-7));
  await page.locator('[data-nut-action="item-remove"][data-index="3"]').click();await verify('Removing reference broth does not change food portions',()=>page.evaluate(()=>mealEditor.items.length===3&&Math.abs(nMealCalories(mealEditor).known-487)<1e-7));await save();
  await open();await page.locator('#nutrition-combo-category').selectOption('沙拉');await page.locator('[data-nut-action="combo-add"][data-id="salad-chicken-dressing"]').click();await page.locator('#meal-qty-1').fill('0.5');await verify('Half dressing adjusts only dressing energy',()=>page.evaluate(()=>Math.abs(nMealCalories(mealEditor).known-334.75)<1e-7));await save();
  await open();await page.locator('#nutrition-combo-category').selectOption('披萨');await page.locator('[data-nut-action="combo-add"][data-id="pizza-two-slices"]').click();await page.locator('#meal-qty-0').fill('250');await verify('Pizza uses actual grams rather than fixed slice counts',()=>page.evaluate(()=>mealEditor.items[0].unit==='g'&&Math.abs(nMealCalories(mealEditor).known-665)<1e-7));await save();
  await page.locator('#app [data-nut-action="meal-new"]').first().click();await page.locator('[data-nut-action="picker-tab"][data-value="search"]').click();await page.locator('#nutrition-search').fill('米村拌饭');await verify('Full store name finds all five rice bowls',()=>page.locator('#nutrition-picker-results [data-nut-action="food-add"]').count().then(n=>n===5));
  await page.locator('#nutrition-search').fill('老乡鸡');await page.locator('[data-nut-action="food-add"][data-id="lxj-chicken-soup"]').click();await action('meal-next');await page.locator('#meal-qty-0').fill('200');await page.locator('[data-nut-action="food-source"]').first().click();await verify('Official per-100g origin remains distinct from recipe estimate',()=>page.locator('#nutrition-content').innerText().then(t=>t.includes('品牌公开营养参考')&&t.includes('2026-07-04')&&t.includes('非官方每份')));await action('meal-params-return');await save();
  await verify('Soup grams scale to 60 kcal and meal snapshots retain recipe provenance',()=>page.evaluate(()=>Math.abs(nMealCalories(nutrition.meals[3]).known-60)<1e-7&&!!nutrition.meals[1].items[0].sourceSnapshot.recipe));
  await page.reload();await verify('Reload preserves totals and does not inject a plan',()=>page.evaluate(()=>nutrition.meals.length===4&&!profile.trainingPlan&&!nutritionProblem&&Math.abs(nutritionDay(nDate()).known-1546.75)<1e-7));
  await verify('No browser runtime errors',async()=>errors.length===0);fs.writeFileSync(path.join(out,'browser-checks.json'),JSON.stringify({checks,errors},null,2));console.log(checks.length+' browser checks passed');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
