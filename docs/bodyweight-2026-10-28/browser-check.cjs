// Isolated Chrome headless profile and test origin; never uses a user's browser data.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'../../nextstep-web/dist'),results=[],errors=[];
const server=http.createServer((req,res)=>{const file=path.join(root,new URL(req.url,'http://localhost').pathname==='/'?'index.html':new URL(req.url,'http://localhost').pathname);fs.readFile(file,(e,data)=>{if(e){res.writeHead(404);res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(data)})});
let browser,ws;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 await new Promise(r=>server.listen(4189,'127.0.0.1',r));
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'nextstep-bodyweight-'));
 browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--disable-sync','--remote-debugging-port=9349','--user-data-dir='+profile,'http://127.0.0.1:4189/'],{windowsHide:true,stdio:'ignore'});
 const getTabs=()=>new Promise((resolve,reject)=>{http.get('http://127.0.0.1:9349/json',r=>{let data='';r.on('data',d=>data+=d);r.on('end',()=>{try{resolve(JSON.parse(data))}catch(e){reject(e)}})}).on('error',reject).setTimeout(1000,function(){this.destroy(Error('timeout'))})});let tabs;for(let i=0;i<80;i++){try{tabs=await getTabs();if(tabs.some(t=>t.url==='http://127.0.0.1:4189/'))break}catch{}await pause(100)}
 ws=new WebSocket(tabs.find(t=>t.url==='http://127.0.0.1:4189/').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let id=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
 const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;setTimeout(()=>{if(pending.has(n)){pending.delete(n);reject(Error('CDP timeout '+method))}},15000);pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))});
 const ev=async expression=>{if(expression.includes('await '))expression='(async()=>{'+expression+'})()';const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
 const check=async(name,expression)=>{const value=await ev(expression);results.push({name,passed:value===true,value});if(value!==true)throw Error(name+': '+JSON.stringify(value))};
 const screenshot=async name=>{const r=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(__dirname,name+'.png'),Buffer.from(r.data,'base64'))};
 const fit=`document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('dialog[open]')].every(d=>d.scrollWidth<=d.clientWidth+1)`;
 await call('Runtime.enable');for(let i=0;i<80;i++){if(await ev("typeof render==='function'"))break;await pause(100)}await ev('localStorage.clear()');await call('Page.reload');await pause(400);await ev("document.getElementById('workout-dialog').close();reminderDismissed=true;render('today')");
 const input=(id,value)=>`document.getElementById('${id}').value='${value}';document.getElementById('${id}').dispatchEvent(new Event('input',{bubbles:true}))`;
 for(const width of [320,390,1280]){
  await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<700});
  await ev("draft=null;restEnd=0;freeSetup();document.querySelector('[data-project-key=俯卧撑]').click()");
  await check('Pushup setup fits '+width,fit);await check('Target is labelled '+width,"document.querySelector('[for=free-reps]').textContent.includes('目标次数')");
  await ev("document.getElementById('free-form').requestSubmit()");await check('Pushup player fits '+width,fit);await check('Actual repetitions are explicit '+width,"document.querySelector('[for=current-reps]').textContent==='实际次数'");
  for(const [i,reps] of [12,8,15].entries()){
   // Deliberately skip input/change events: completion still captures the live value.
   await ev(`document.getElementById('current-reps').value='${reps}';document.getElementById('current-set-form').requestSubmit()`);
   await check('Set '+(i+1)+' stores actual reps '+width,`draft.items[0].sets[${i}].reps===${reps}&&draft.items[0].sets[${i}].done&&draft.items[0].sets[${i}].weight===null`);
   await ev("document.querySelector('[data-action=skip-set-feedback]').click()");
   if(i<2)await ev("document.querySelector('[data-action=skip-rest]').click()");
  }
  await ev("document.querySelector('[data-action=save-workout]').click();recordDialog(records[0].id)");await check('History keeps varying reps '+width,"JSON.stringify(records[0].items[0].sets.map(s=>s.reps))==='[12,8,15]'&&records[0].volume===0");await check('History fits '+width,fit);await screenshot('pushup-history-'+width);
  await ev("document.querySelector('[data-edit-record]').click()");await check('History editing fits '+width,fit);
  await ev("document.getElementById('workout-dialog').close();freeSetup();document.querySelector('[data-project-key=平板支撑]').click()");
  await check('Plank setup uses seconds '+width,"document.querySelector('[for=free-reps]').textContent.includes('秒')&&document.getElementById('free-reps').value==='30'");await check('Plank setup fits '+width,fit);
  await ev("document.getElementById('free-form').requestSubmit()");await check('Plank player seconds '+width,"document.querySelector('[for=current-reps]').textContent==='实际时长 / 秒'&&document.getElementById('current-reps').max==='3600'");await check('Plank player fits '+width,fit);await screenshot('plank-player-'+width);
  await ev(input('current-reps','75'));await call('Page.reload');await pause(350);await ev('workoutDialog()');await check('Input survives reload '+width,"document.getElementById('current-reps').value==='75'&&draft.items[0].measure==='seconds'");
  await ev("document.getElementById('current-set-form').requestSubmit();saveSetFeedback();endRest();workoutOptions();editLastSet()");await check('Last set editing uses seconds '+width,"document.querySelector('[for=last-reps]').textContent.includes('秒')");await check('Last set fits '+width,fit);
  await ev("document.getElementById('last-reps').value='80';document.getElementById('last-set-form').requestSubmit();finishReview();finishWorkout();recordDialog(records[0].id)");await check('Plank history unit '+width,"document.querySelector('.set-table thead').textContent.includes('秒')&&records[0].items[0].sets[0].reps===80");
  await ev("recordEditDialog(records[0].id);document.getElementById('edit-reps-0-0').value='125';document.getElementById('record-edit-form').requestSubmit()");await check('Historical seconds above 100 save '+width,"records[0].items[0].sets[0].reps===125&&records[0].volume===0");
  await ev("document.getElementById('workout-dialog').close();freeSetup();document.querySelector('[data-project-key=平衡板]').click()");await check('Balance board setup '+width,"document.querySelector('[for=free-reps]').textContent.includes('秒')&&document.querySelector('.movement-svg')!==null");await check('Balance setup fits '+width,fit);
  await ev("document.getElementById('free-form').requestSubmit()");await check('Balance player fits '+width,fit);await screenshot('balance-player-'+width);
  await ev("draft=null;restEnd=0;trainingCart=null;profile.trainingCart=null;document.getElementById('workout-dialog').close();openTrainingShop('today');toggleTrainingProduct('平板支撑');toggleTrainingProduct('平衡板');trainingCart.step='review';trainingShopDialog()");await check('Cart seconds label '+width,"document.querySelector('.training-cart-fields').textContent.includes('秒')");await check('Cart fits '+width,fit);await screenshot('cart-'+width);
  await ev("trainingCart=null;profile.trainingCart=null;document.getElementById('workout-dialog').close();render('training');journalView='progress';render('training');document.querySelector('[data-period=month]').click()");await check('Statistics fits '+width,fit);await check('Period switch preserves focus '+width,"document.activeElement.dataset.period==='month'");
 }
 await ev("startFreeWorkout({exercise:'俯卧撑',sets:'2',reps:'10'});Storage.prototype.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('quota')};document.getElementById('current-reps').value='16';document.getElementById('current-set-form').requestSubmit()");
 await check('Failed write keeps editable current form',"!draft.items[0].sets[0].done&&draft.items[0].sets[0].reps===10&&document.getElementById('current-reps').value==='16'");
 await ev("Storage.prototype.setItem=Storage.prototype.originalSetItem;document.getElementById('current-set-form').requestSubmit()");await check('Retry keeps actual input',"draft.items[0].sets[0].done&&draft.items[0].sets[0].reps===16");
 await ev("draft={mode:'free',name:'旧训练',startedAt:Date.now(),items:[{name:'平板支撑',type:'bodyweight',sets:[{weight:null,reps:12,done:false}]}]};restEnd=0;selectedExercise=0;workoutDialog()");await check('Old unmarked custom plank keeps repetitions',"document.querySelector('[for=current-reps]').textContent==='实际次数'");
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(__dirname,'browser-results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({passed:results.length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{ws?.close();browser?.kill();server.close()});
