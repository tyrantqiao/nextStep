// Isolated Chrome headless profile and test origin; never uses a user's browser data.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../nextstep-web/dist'),results=[],errors=[];
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname==='/'?'index.html':new URL(req.url,'http://localhost').pathname);fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data)})});
let browser,ws;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(r=>server.listen(4190,'127.0.0.1',r));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nextstep-buttons-'));
 browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--disable-sync','--remote-debugging-port=9350','--user-data-dir='+profile,'http://127.0.0.1:4190/'],{windowsHide:true,stdio:'ignore'});
 const getTabs=()=>new Promise((resolve,reject)=>{http.get('http://127.0.0.1:9350/json',r=>{let data='';r.on('data',d=>data+=d);r.on('end',()=>{try{resolve(JSON.parse(data))}catch(e){reject(e)}})}).on('error',reject).setTimeout(1000,function(){this.destroy(Error('timeout'))})});let tabs;for(let i=0;i<80;i++){try{tabs=await getTabs();if(tabs.some(t=>t.url==='http://127.0.0.1:4190/'))break}catch{}await pause(100)}
 ws=new WebSocket(tabs.find(t=>t.url==='http://127.0.0.1:4190/').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(Error('CDP timeout '+method))}},15000);pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
 const ev=async expression=>{if(expression.includes('await '))expression='(async()=>{'+expression+'})()';const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const check=async(name,expression)=>{const value=await ev(expression);results.push({name,passed:value===true,value});if(value!==true)throw Error(name+': '+JSON.stringify(value))};
 const screenshot=async name=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(__dirname,name+'.png'),Buffer.from(r.data,'base64'))};
 const fit=`document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('dialog[open]')].every(d=>d.scrollWidth<=d.clientWidth+1)`;
 await call('Runtime.enable');for(let i=0;i<80;i++){if(await ev("typeof render==='function'"))break;await pause(100)}await ev('localStorage.clear()');await call('Page.reload');await pause(400);await ev("document.getElementById('workout-dialog').close();reminderDismissed=true;render('today')");
 const phase=process.argv.includes('--verify')?'after':'before',audit=[];
 const snapshot=async(name)=>{await pause(30);const data=await ev(`(()=>{const dialog=[...document.querySelectorAll('dialog[open]')].at(-1),root=dialog||document.getElementById('app'),visible=e=>e.getClientRects().length>0;const buttons=[...root.querySelectorAll('button')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim().slice(0,28),class:e.className,w:Math.round(r.width),h:Math.round(r.height),x:Math.round(r.x),y:Math.round(r.y)}});const groups=[...root.querySelectorAll('.settings-actions,.card-actions,.n-actions,.training-shop-footer,.dialog-header,.n-portions,.project-tabs,.journal-views')].filter(visible).map(g=>({class:g.className,buttons:[...g.children].filter(e=>e.tagName==='BUTTON'&&visible(e)).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent.trim(),w:Math.round(r.width),h:Math.round(r.height),y:Math.round(r.y)}})}));return {fit:document.documentElement.scrollWidth<=innerWidth&&(!dialog||dialog.scrollWidth<=dialog.clientWidth+1),buttons,groups}})()`);audit.push({name,width,...data});if(!data.fit)throw Error('Overflow '+name);if(phase==='after'){const pairs=data.groups.filter(g=>['n-actions','card-actions','settings-actions'].some(c=>g.class.split(' ').includes(c))&&g.buttons.length>1);for(const g of pairs)if(Math.max(...g.buttons.map(b=>b.w))-Math.min(...g.buttons.map(b=>b.w))>1||Math.max(...g.buttons.map(b=>b.h))-Math.min(...g.buttons.map(b=>b.h))>1)throw Error('Unequal actions '+name+JSON.stringify(g));for(const b of data.buttons.filter(b=>/primary-button|secondary-button|close-button/.test(b.class)))if(b.h<44)throw Error('Small action '+name+JSON.stringify(b))}if(width===390||width===320&&['prepare','shop-params','meal-review','profile'].includes(name))await screenshot(phase+'-'+name+'-'+width)};
 let width;
 for(width of [320,390,430,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<700});
  await ev("document.querySelectorAll('dialog[open]').forEach(d=>d.close());draft=null;restEnd=0;selectedExercise=0;profile={...profileDefaults,name:'走查',height:175,weight:70,goal:'保持健康',frequency:'每周 3 次',lifestyle:'久坐为主',experience:'刚开始',duration:'30',equipment:'徒手 / 家中'};profile.trainingPlan=generatePlan(profile);homeView='today';render('today')");await snapshot('today');
  await ev("changeHomeView('plan')");await snapshot('plan');
  await ev("homeLaunchDialog()");await snapshot('prepare');
  await ev("openTrainingShop('today');toggleTrainingProduct('俯卧撑');toggleTrainingProduct('平板支撑');trainingCart.step='review';trainingShopDialog()");await snapshot('shop-params');
  await ev("trainingCart.step='schedule';trainingShopDialog()");await snapshot('shop-confirm');
  await ev("confirmWeeklyRepeat()");await snapshot('shop-repeat');
  await ev("freeSetup();chooseProject('free','俯卧撑')");await snapshot('free-params');
  await ev("startFreeWorkout({exercise:'俯卧撑',sets:'3',reps:'10'})");await snapshot('player');
  await ev("toggleWorkoutPause()");await snapshot('paused');
  await ev("toggleWorkoutPause();completeSet(0)");await snapshot('set-feedback');
  await ev("saveSetFeedback()");await snapshot('rest');
  await ev("workoutOptions()");await snapshot('tools');
  await ev("workoutSettings()");await snapshot('workout-settings');
  await ev("editLastSet()");await snapshot('edit-last');
  await ev("discardPrompt()");await snapshot('discard');
  await ev("finishReview()");await snapshot('finish');
  await ev("finishWorkout();recordDialog(records[0].id)");await snapshot('record');
  await ev("recordEditDialog(records[0].id)");await snapshot('record-edit');
  await ev("recordDeleteDialog(records[0].id)");await snapshot('record-delete');
  await ev("document.getElementById('workout-dialog').close();journalView='progress';render('training')");await snapshot('statistics');
  await ev("openSettings()");await snapshot('settings');
  await ev("editPersonal()");await snapshot('personal');
  await ev("openTrainingSettings()");await snapshot('plan-settings');
  await ev("sportSetup();chooseProject('sport','walk')");await snapshot('sport');
  await ev("document.getElementById('workout-dialog').close();render('profile')");await snapshot('profile');
  await ev("nBodyForm()");await snapshot('body-form');
  await ev("document.getElementById('nutrition-dialog').close();render('nutrition')");await snapshot('nutrition');
  await ev("nTargetDialog()");await snapshot('nutrition-target');
  await ev("document.getElementById('nutrition-dialog').close();mealEditor=null;await nStartMeal('lunch')");await snapshot('meal-stores');
  await ev("mealEditor.picker='search';mealEditor.store='';nMealRender()");await snapshot('meal-search');
  await ev("mealEditor.items=[nNewItem(foodCatalog.find(f=>f.id==='rice'),100)];nMenuCart()");await snapshot('meal-cart');
  await ev("nMealReview()");await snapshot('meal-review');
  await ev("mealEditor.step='params';mealEditor.editing='test';nMealRender()");await snapshot('meal-edit');
  await ev("nCustomFood()");await snapshot('custom-food');
  await ev("nSource(0)");await snapshot('food-source');
  await ev("document.getElementById('nutrition-dialog').close();mealEditor=null;trainingCart=null");
 }
 if(phase==='after'){
  for(const size of [{width:320,height:568},{width:390,height:640}]){
   width=size.width;await call('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:true});
   for(const [name,expression] of [['short-prepare',"document.querySelectorAll('dialog[open]').forEach(d=>d.close());draft=null;homeLaunchDialog()"],['short-shop',"trainingCart=null;openTrainingShop('today');trainingCart.step='review';trainingShopDialog()"],['short-player',"startFreeWorkout({exercise:'俯卧撑',sets:'2',reps:'10'})"],['short-meal',"document.getElementById('workout-dialog').close();mealEditor=null;await nStartMeal('lunch');mealEditor.items=[nNewItem(foodCatalog.find(f=>f.id==='rice'),100)];nMealReview()"]]){
    await ev(expression);await snapshot(name);
    await ev("(()=>{const root=[...document.querySelectorAll('dialog[open]')].at(-1);const elements=[root,...root.querySelectorAll('*')];const sizes=elements.map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of sizes)e.style.fontSize=size*1.25+'px'})()");await snapshot(name+'-font125');
   }
  }
  // Hit-test and click real pointer coordinates through the final nutrition actions.
  await ev("document.querySelector('[data-nut-action=menu-cart]').scrollIntoView({block:'center'})");
  const point=await ev("(()=>{const e=document.querySelector('[data-nut-action=menu-cart]'),r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e}})()");if(!point.hit)throw Error('Cart button is obscured');
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});await check('Pointer click opens cart',"nutritionModal==='meal-cart'");
 }
 fs.writeFileSync(path.join(__dirname,phase+'-audit.json'),JSON.stringify(audit,null,2));console.log(JSON.stringify({phase,states:audit.length,errors,checks:results.length}));if(errors.length)throw Error(errors.join('\n'));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{ws?.close();browser?.kill();server.close()});
