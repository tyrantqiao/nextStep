// Isolated Edge headless profile and test origin; never uses a user's browser data.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../nextstep-web/dist'),results=[],errors=[];
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname==='/'?'index.html':new URL(req.url,'http://localhost').pathname);fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data)})});
let browser,ws;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(r=>server.listen(4186,'127.0.0.1',r));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nextstep-energy-'));
 browser=spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',['--headless=new','--no-first-run','--disable-sync','--remote-debugging-port=9346','--user-data-dir='+profile,'http://127.0.0.1:4186/'],{windowsHide:true,stdio:'ignore'});
 const getTabs=()=>new Promise((resolve,reject)=>{http.get('http://127.0.0.1:9346/json',r=>{let data='';r.on('data',d=>data+=d);r.on('end',()=>{try{resolve(JSON.parse(data))}catch(e){reject(e)}})}).on('error',reject)});let tabs;for(let i=0;i<80;i++){try{tabs=await getTabs();if(tabs.some(t=>t.url==='http://127.0.0.1:4186/'))break}catch{}await pause(100)}
 ws=new WebSocket(tabs.find(t=>t.url==='http://127.0.0.1:4186/').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
 const ev=async expression=>{if(expression.includes('await '))expression='(async()=>{'+expression+'})()';const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const check=async(name,expression)=>{const value=await ev(expression);results.push({name,passed:value===true,value});if(value!==true)throw Error(name+': '+JSON.stringify(value))};
 const screenshot=async name=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(__dirname,name+'.png'),Buffer.from(r.data,'base64'))};
 const fit=`document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('dialog[open]')].every(d=>d.scrollWidth<=d.clientWidth+1)`;
 await call('Runtime.enable');for(let i=0;i<80;i++){if(await ev("typeof render==='function'"))break;await pause(100)}await ev('localStorage.clear()');await call('Page.reload');await pause(400);await ev("document.getElementById('workout-dialog').close();reminderDismissed=true;render('today')");
 for(const width of [320,390,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  await ev("render('nutrition')");await check('Empty nutrition fits '+width,fit);await check('Incomplete profile stays unknown '+width,"document.querySelector('.n-expenditure-value').textContent.includes('—')");
  await ev("document.querySelector('[data-action=energy-basis]').click()");await check('Basis dialog fits '+width,fit);await ev("document.querySelector('[data-action=edit-personal]').click()");await check('Profile form fits '+width,fit);
  await ev("document.querySelector('[data-action=close]').click();render('today')");await check('Today recommendation fits '+width,fit);await screenshot('empty-today-'+width);
 }
 await ev("editPersonal();for(const [name,value] of Object.entries({name:'验收',height:'175',weight:'70',energyAge:'30',energySex:'male',energyFactor:'1.2'}))document.querySelector('#personal-form [name='+name+']').value=value;document.getElementById('personal-form').requestSubmit()");
 await check('Profile saved through real form',"profile.energyAge===30&&profile.energySex==='male'&&profile.energyFactor===1.2&&!document.getElementById('workout-dialog').open");
 await call('Page.reload');await pause(400);await check('Formula settings survive reload','profile.energyAge===30&&nDailyExpenditure().total===1979');
 await ev("document.getElementById('workout-dialog').close();await nStartMeal('lunch');mealEditor.items=[nNewItem(foodCatalog.find(f=>f.id==='rice'),100)];mealEditor.energyMode='manual';mealEditor.manualEnergyKcal=2000;await nSaveMeal();render('nutrition')");
 await check('Partial food does not claim daily balance',"!document.querySelector('.n-expenditure').textContent.includes('估算盈余约')");
 await ev("document.querySelector('[data-nut-action=confirm-day]').click()");await pause(150);
 await check('Complete food shows daily balance',"document.querySelector('.n-expenditure').textContent.includes('估算盈余约 21 kcal')");
 for(const width of [320,390,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  await ev("render('nutrition');window.scrollTo(0,0)");await pause(400);await check('Filled nutrition fits '+width,fit);await screenshot('nutrition-'+width);
  await ev("document.querySelector('[data-action=energy-basis]').click()");await check('Filled basis fits '+width,fit);await screenshot('basis-'+width);await ev("document.querySelector('[data-action=close]').click();render('today');window.scrollTo(0,0)");
  await pause(400);await check('Filled today fits '+width,fit);await screenshot('today-'+width);
  await ev("document.querySelector('[data-action=nutrition-training-preview]').click()");await check('Preview fits and waits for confirmation '+width,fit+'&&draft===null');await screenshot('confirm-'+width);await ev("document.querySelector('[data-action=close]').click();journalView='history';render('training')");await check('Training history fits '+width,fit);
 }
 await ev("render('today');document.querySelector('[data-action=nutrition-training-preview]').click();document.querySelector('[data-action=nutrition-training-start]').click()");
 await check('Confirmation starts suggested groups',"draft.items.length===3&&draft.items[0].sets.length===2&&draft.items[0].sets[0].reps===8");
 await call('Page.reload');await pause(300);await check('Current draft survives reload','draft.items.length===3&&nTodayTrainingAdvice().action===\"continue-draft\"');
 await ev("workoutDialog();completeSet(0);saveSetFeedback('合适');finishReview();finishWorkout()");await check('Saving updates advice to recovery','draft===null&&records.length===1&&!planCompleted(nDate())&&nTodayTrainingAdvice().title.includes(\"恢复\")');
 await ev("render('nutrition');document.querySelector('[data-nut-action=date-prev]').click()");await pause(100);await check('Nutrition previous date is local and independent','nutritionDate===nShift(nDate(),-1)&&nDailyExpenditure(nutritionDate).count===0');
 await ev("journalView='progress';render('training');window.scrollTo(0,180);changePeriod('month')");await check('Statistics retain scroll position','window.scrollY===180');
 await check('No browser runtime errors',JSON.stringify(errors.length===0));
 console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.passed).length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{fs.writeFileSync(path.join(__dirname,'browser-results.json'),JSON.stringify({results,errors},null,2));if(ws?.readyState===1){ws.send(JSON.stringify({id:999999,method:'Browser.close'}));await pause(150)}ws?.close();browser?.kill();server.close()});
