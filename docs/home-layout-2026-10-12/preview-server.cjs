// Isolated browser fixtures; never used by the shipped app.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../nextstep-web/dist');
const date=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4187'),file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 try{let body=fs.readFileSync(file);if(url.pathname==='/'){
  const state=url.searchParams.get('state')||'saved',item={name:'哑铃卧推',type:'weighted',muscle:'胸部',sets:3,reps:10,weight:8};
  const profile={name:'测试用户',weight:'70',height:'175',goal:'增肌',frequency:'每周 3 次',lifestyle:'久坐为主',experience:'刚开始',duration:'30',equipment:'哑铃',trainingPlan:{days:Array.from({length:7},()=>({name:state==='rest'?'休息与自由活动':'全身力量训练',items:state==='rest'?[]:[item,{...item,name:'哑铃划船',muscle:'背部'}]}))}};
  const record={id:1,name:'今日力量训练',mode:'plan',date:date(),minutes:32,seconds:1920,sets:3,volume:240,items:[{...item,sets:[{done:true,weight:8,reps:10},{done:true,weight:8,reps:10},{done:true,weight:8,reps:10}],calorieEstimate:{minutes:8,met:3.5,bodyWeight:70,calories:33,activityCode:'02054',calorieMethod:'MET × kg × hours (gross)',source:'https://pacompendium.com/'}}]};
  profile.updatedAt=Date.now();
  if(state==='schedule')profile.trainingPlan.days=[
   {name:'胸背力量',items:[item,{...item,name:'哑铃划船',muscle:'背部'}]},
   {name:'休息与自由活动',items:[]},
   {name:'核心训练',items:[{name:'卷腹',type:'bodyweight',muscle:'核心',sets:2,reps:12}]},
   {name:'休息与自由活动',items:[]},
   {name:'腿部训练',items:[{...item,name:'哑铃高脚杯深蹲',muscle:'下肢'}]},
   {name:'肩部训练',items:[{...item,name:'哑铃肩推',muscle:'肩部'}]},
   {name:'休息与自由活动',items:[]}
  ];
  const stored=state==='empty'?{}:{'nextstep.profile':profile};
  if(state==='saved')stored['nextstep.records']=[record,{id:2,name:'晚间散步',mode:'sport',date:date(),minutes:20,seconds:1200,sets:0,volume:0,items:[],met:3.8,bodyWeight:70,calories:89,activityCode:'17190'}];
  if(['active','paused','finished'].includes(state))stored['nextstep.draft']={name:'全身力量训练',mode:'free',manualEnd:true,startedAt:Date.now()-600000,restSeconds:60,restEnd:0,paused:state==='paused',...(state==='finished'?{finishedAt:Date.now()}:{}),items:[{name:'哑铃卧推',type:'weighted',restSeconds:60,sets:[{done:true,weight:8,reps:10},{done:false,weight:8,reps:10}]}],activities:[]};
  body=body.toString().replace('<script src="app.js"',`<script>for(const k of ['nextstep.profile','nextstep.records','nextstep.draft','nextstep.activityRecords'])localStorage.removeItem(k);for(const [k,v] of Object.entries(${JSON.stringify(stored)}))localStorage.setItem(k,JSON.stringify(v));</script><script src="app.js"`);
 }
 res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(body);
 }catch{res.writeHead(404);res.end()}
}).listen(4187,'127.0.0.1',()=>console.log('Fixture preview http://127.0.0.1:4187/?state=saved'));
