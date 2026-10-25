const fs=require('node:fs'),path=require('node:path');
const references=JSON.parse(fs.readFileSync(path.join(__dirname,'usda-selected-references.json'),'utf8').replace(/^\uFEFF/,''));
const definitions=[
 ['lychee','荔枝','水果','09164',100,'去皮去核可食生重'],
 ['cherry','甜樱桃','水果','09070',100,'去梗去核可食生重'],
 ['papaya','木瓜','水果','09226',150,'去皮去籽可食生重'],
 ['plum','李子','水果','09279',100,'去核可食生重'],
 ['raspberry','树莓','水果','09302',80,'可食生重'],
 ['celery','芹菜','蔬菜','11143',150,'可食生重，烹饪油另算'],
 ['bamboo-shoot','竹笋（原料）','蔬菜','11026',100,'可食生重，仅用于配方记录；需按品种充分处理煮熟后食用'],
 ['lotus-root','莲藕（原料）','蔬菜','11254',100,'可食生重，烹饪油另算'],
 ['pumpkin','南瓜（原料）','蔬菜','11422',150,'去皮去籽可食生重，不是熟成品重量'],
 ['winter-melon','冬瓜（原料）','蔬菜','11593',150,'去皮去籽可食生重'],
 ['enoki','金针菇（原料）','蔬菜','11950',100,'可食生重，需充分煮熟；烹饪油另算'],
 ['mung-sprouts','绿豆芽','蔬菜','11043',150,'可食生重，烹饪油另算'],
 ['cashew','腰果仁（无盐干烤）','坚果零食','12085',20,'不含壳，不适用于额外裹糖或油炸款'],
 ['pumpkin-seeds','南瓜籽仁（无盐烤制）','坚果零食','12016',20,'只记籽仁，不含壳'],
 ['tahini','芝麻酱（通用参考）','调味','12166',15,'烤芝麻酱参考；不是门店调制蘸料，包装和稀释比例优先'],
 ['raw-shrimp','虾仁（生，可食部）','蛋白来源','15149',100,'混合虾种SR28历史参考71kcal/100g；去壳可食生重，不套用熟虾或所有虾种'],
 ['raw-tripe','牛肚（生，通用参考）','蛋白来源','13341',100,'可食生重，不同加工毛肚含水量不同；煮熟后食用'],
 ['raw-beef85','牛肉（生，85%瘦肉参考）','蛋白来源','23567',100,'85%瘦肉15%脂肪生绞牛肉参考；不是特定肥牛片或品牌部位实测'],
 ['raw-ground-pork','猪肉馅（生，通用参考）','蛋白来源','10219',100,'生绞猪肉参考，肥瘦比例不同时请编辑热量'],
 ['wheat-flour','小麦粉（干重）','主食','20081',50,'通用白面粉干重，不直接套用馒头、饺子皮或煮熟面条重量'],
 ['roast-wing','烤鸡翅（带皮熟可食部）','蛋白来源','05103',80,'熟肉和皮，不含骨及额外酱汁；80g仅为快捷可食部参考，不等于两只鸡翅'],
 ['quinoa-dry','藜麦（干重）','主食','20035',50,'烹饪前干重，不直接套用煮熟重量']
];
const foods=definitions.map(([id,name,category,ndb,portion,note])=>{const r=references.foods.find(f=>f.ndb===ndb);if(!r)throw Error(ndb);return {id,name,category,ndb,portion,note,description:r.description,kcal:r.energyKcal}});
const recipes=[
 ['steamed-bun','原味馒头（配方估算）','早餐',[['wheat-flour',50],['water',30]],'1个参考配方使用干面粉50g＋水30ml，忽略少量酵母热量；未核实蒸后克重，不适用于成品每80g',['馒头','白馒头']],
 ['pork-bao','猪肉白菜包（配方估算）','早餐',[['wheat-flour',40],['raw-ground-pork',25],['napa-cabbage',30],['water',25],['oil',2],['soy-sauce',3]],'1个参考包：面粉干重40g＋生肉馅25g＋白菜生重30g＋水25ml＋油2g＋酱油3g；不是门店标准份',['包子','肉包']],
 ['pork-dumplings','猪肉白菜水饺（6个参考，配方估算）','家常',[['wheat-flour',60],['raw-ground-pork',50],['napa-cabbage',60],['water',40],['oil',3],['soy-sauce',5]],'本配方分成6个参考水饺，按1份记录；生面粉/肉馅/白菜投入量，不是煮后克重；蘸料另记',['饺子','水饺']],
 ['scallion-pancake','葱油饼（配方估算）','早餐',[['wheat-flour',60],['water',35],['onion',10],['oil',10]],'1份以面粉干重60g＋水35ml＋洋葱10g近似葱类＋油10g，成品大小和吸油量可不同',['手抓饼','葱饼']],
 ['chicken-congee','鸡肉粥（配方估算）','早餐',[['rice',100],['chicken',40],['water',250]],'熟米饭100g＋熟鸡胸40g＋水250ml；1参考碗，非生米100g；不含额外油',['粥','鸡丝粥']],
 ['pumpkin-congee','南瓜玉米粥（配方估算）','早餐',[['rice',80],['pumpkin',100],['corn',30],['water',250]],'熟饭80g＋南瓜生可食100g＋熟玉米粒30g＋水250ml；不含糖',['粥','南瓜粥']],
 ['celery-pork','芹菜炒肉（配方估算）','家常',[['celery',150],['cooked-pork',80],['oil',8],['soy-sauce',8]],'芹菜生重150g＋熟猪肉80g＋油8g＋酱油8g；不含米饭',[]],
 ['lotus-stirfry','清炒藕片（配方估算）','家常',[['lotus-root',150],['oil',8],['soy-sauce',5]],'莲藕生重150g＋油8g＋酱油5g；不含饭',[]],
 ['shrimp-egg','虾仁炒蛋（配方估算）','家常',[['raw-shrimp',100],['egg',2],['oil',8]],'虾仁生可食100g＋2个鸡蛋按熟蛋参考近似＋油8g；不含饭',[]],
 ['mushroom-chicken','菌菇鸡肉（配方估算）','家常',[['mushroom',100],['enoki',80],['chicken',100],['oil',8],['soy-sauce',10]],'鲜蘑菇和金针菇生重100g/80g＋熟鸡胸100g＋油8g＋酱油10g；不含饭',[]],
 ['tomato-beef-noodles','番茄牛肉面（含面配方估算）','家常',[['pasta',180],['cooked-beef',60],['tomato',150],['water',250],['oil',5],['soy-sauce',8]],'用熟原味意面180g近似面条＋熟牛肉60g＋番茄生重150g＋水250ml＋油5g＋酱油8g；面已含，汤全计',['牛肉面','汤面']],
 ['mapo-tofu','肉末豆腐（配方估算）','家常',[['tofu',200],['raw-ground-pork',40],['oil',10],['soy-sauce',10]],'豆腐原重200g＋生猪肉馅40g＋油10g＋酱油10g；不含米饭及额外辣油',['麻婆豆腐']],
 ['cucumber-salad','凉拌黄瓜（配方估算）','家常',[['cucumber',200],['oil',5],['soy-sauce',10],['vinegar',5]],'黄瓜生可食200g＋油5g＋酱油10g＋红酒醋参考5g；未包含额外糖',['拍黄瓜']],
 ['winter-melon-soup','冬瓜虾仁汤（配方估算）','家常',[['winter-melon',200],['raw-shrimp',80],['water',300],['oil',3]],'冬瓜生可食200g＋虾仁生可食80g＋水300ml＋油3g；参考汤全计',[]],
 ['ph-supreme','必胜客 超级至尊风味披萨（参考片，配方估算）','必胜客',[['wheat-flour',30],['water',18],['mozzarella',20],['cooked-beef',15],['green-pepper',10],['onion',5],['tomato',15],['oil',3]],'1份为自定参考片：面粉干重30g等投入量；非品牌配方、标准切片、尺寸或饼底热量，未核实烤后重量',['超级至尊','比萨','Pizza Hut'],'pizzaHut'],
 ['ph-cheese','必胜客 芝士披萨（100g通用食物估算）','必胜客',[['cheese-pizza',100]],'1份按100g普通饼底芝士披萨通用食物参考；不是品牌官方营养，不等于固定一片，各尺寸饼底需按实际食用量改份数',['芝士比萨','Pizza Hut'],'pizzaHut'],
 ['ph-beef-pasta','必胜客 番茄牛肉意面（配方估算）','必胜客',[['pasta',200],['cooked-beef',60],['tomato',100],['onion',30],['oil',8],['soy-sauce',5]],'熟意面200g＋熟牛肉60g＋生番茄100g＋洋葱30g＋油8g＋酱油5g；独立参考肉酱，面已含',['肉酱面','意大利面','Pizza Hut'],'pizzaHut'],
 ['ph-mushroom-pasta','必胜客 奶香蘑菇意面（配方估算）','必胜客',[['pasta',200],['mushroom',80],['full-milk',80],['mozzarella',15],['oil',8]],'熟意面200g＋生蘑菇80g＋全脂奶80g＋芝士15g＋油8g；非品牌奶油酱配方，面和参考酱已含',['奶油意面','Pizza Hut'],'pizzaHut'],
 ['ph-roast-wing','必胜客 风味烤翅（熟可食80g配方估算）','必胜客',[['roast-wing',80],['sugar',5],['soy-sauce',8]],'带皮烤翅熟可食80g＋糖5g＋酱油8g；不含骨，80g不等于固定几只；独立酱汁参考',['鸡翅','烤翅','Pizza Hut'],'pizzaHut'],
 ['ph-cheese-corn','必胜客 芝士玉米（配方估算）','必胜客',[['corn',120],['mozzarella',25],['oil',3]],'熟玉米粒120g＋马苏里拉25g＋油3g；不是门店标准份',['焗玉米','Pizza Hut'],'pizzaHut'],
 ['ph-salad','必胜客 蔬菜沙拉（不含酱估算）','必胜客',[['lettuce',100],['cucumber',60],['tomato',60],['corn',40]],'生菜100g＋黄瓜60g＋番茄60g＋熟玉米粒40g；不含沙拉酱，按实际另记',['轻食','Pizza Hut'],'pizzaHut'],
 ['hdl-shrimp-paste','海底捞 捞派虾滑（配方估算）','海底捞',[['raw-shrimp',90],['wheat-flour',5],['water',5]],'本应用90g生虾仁＋5g面粉＋5ml水的独立参考100g配方，不声称为品牌虾肉比例或工艺；不含汤底与蘸料',['虾滑','HDL'],'haidilao'],
 ['hdl-tomato-broth','海底捞 番茄汤食用量（配方估算）','海底捞',[['tomato',100],['water',200],['oil',3],['sugar',3]],'番茄生重100g＋水200ml＋油3g＋糖3g；1份为本参考汤汁全部食用量，非整锅；不含涮菜、其他配料或蘸料',['番茄锅','汤底','HDL'],'haidilao'],
 ['hdl-spicy-broth','海底捞 麻辣汤食用量（配方估算）','海底捞',[['water',250],['oil',10],['soy-sauce',10]],'水250ml＋食用油10g＋酱油10g为个人吃进汤汁与附着油的独立参考，非整锅、非品牌牛油锅配方；不喝汤也可能吃进附着油',['麻辣锅','牛油锅','汤底','HDL'],'haidilao'],
 ['hdl-sesame-sauce','海底捞 芝麻酱蘸料（配方估算）','海底捞',[['tahini',20],['soy-sauce',5],['water',15]],'纯芝麻酱通用参考20g＋酱油5g＋水15ml，1份参考蘸料约40g；不是门店小料标准配方，按实际吃进量调整',['麻酱','蘸碟','小料','HDL'],'haidilao']
];
const hotpotFoods=[
 ['hdl-beef','海底捞 牛肉片（生肉通用参考）','raw-beef85',100,['肥牛','涮牛肉']],
 ['hdl-tripe','海底捞 牛肚（生牛肚通用参考）','raw-tripe',100,['毛肚','牛百叶']],
 ['hdl-shrimp','海底捞 虾仁（生可食部参考）','raw-shrimp',100,['鲜虾']],
 ['hdl-tofu','海底捞 豆腐（食材参考）','tofu',100,['嫩豆腐']],
 ['hdl-lotus','海底捞 藕片（生食材参考）','lotus-root',100,['莲藕']],
 ['hdl-potato','海底捞 土豆片（生食材参考）','potato-raw',100,['土豆']],
 ['hdl-lettuce','海底捞 生菜（生食材参考）','lettuce',100,['蔬菜']],
 ['hdl-enoki','海底捞 金针菇（生食材参考）','enoki',100,['菌菇']],
 ['hdl-corn','海底捞 玉米粒（熟食材参考）','corn',100,['玉米']]
];
const script=`
/* 2026-10-25: selected USDA references, everyday dishes and two store menus. */
const additionalFoodReferences=${JSON.stringify(foods,null,2)};
for(const r of additionalFoodReferences){const f=foodEntry(r.id,r.name,r.category,'g',100,r.kcal,r.portion,'sr28',r.note+'；USDA SR28 NDB '+r.ndb);f.reference={ndb:r.ndb,description:r.description,kcalPer100g:r.kcal};f.checkedAt='2026-10-25';foodCatalog.push(f)}
storeMenus.pizzaHut={name:'必胜客中国菜单与百胜中国品牌介绍',url:'https://www.pizzahut.com.cn/Product',scope:'仅作品牌和餐饮类别背景，不提供本条目的大陆官方热量；所列为本应用参考搭配，不保证当店在售'};
storeMenus.haidilao={name:'海底捞官方网站特色菜',url:'https://www.haidilao.com/cate/dish/specialty',scope:'仅作捞派虾滑等菜名和品牌背景，不作为本应用配方热量来源；份量不是门店标准份'};
const additionalFoodRecipes=${JSON.stringify(recipes,null,2)};
for(const [id,name,category,parts,note,aliases,menu]of additionalFoodRecipes){const f=foodRecipe(id,name,category,parts,note,aliases,menu?storeMenus[menu]:null);f.checkedAt='2026-10-25'}
const additionalHotpotFoods=${JSON.stringify(hotpotFoods,null,2)};
for(const [id,name,reference,portion,aliases]of additionalHotpotFoods){const base=foodCatalog.find(f=>f.id===reference),f=foodEntry(id,name,'海底捞','g',100,base.basis.energyKcal,portion,'sr28',base.note+'；按个人实际食用的对应生/熟食材可食量记录，不是门店整份或下锅后称重；汤底、附着油、蘸料另记',aliases.concat('HDL'));f.reference={...base.reference};f.menuSource=storeMenus.haidilao;f.checkedAt='2026-10-25';f.browseTags=['restaurant','lunch','dinner',...(['hdl-beef','hdl-tripe','hdl-shrimp'].includes(id)?['meat']:id==='hdl-tofu'?['dairy']:id==='hdl-corn'?['staple']:['vegetable'])];foodCatalog.push(f)}
foodCombos.push(
 {id:'ph-pasta-salad',name:'必胜客 牛肉意面配沙拉（参考）',category:'必胜客',items:[['ph-beef-pasta',1],['ph-salad',1]]},
 {id:'ph-pizza-wing',name:'必胜客 芝士披萨100g配烤翅（参考）',category:'必胜客',items:[['ph-cheese',1],['ph-roast-wing',1]]},
 {id:'hdl-ingredients',name:'海底捞 牛肉豆腐蔬菜（汤料另记）',category:'海底捞',items:[['hdl-beef',100],['hdl-tofu',100],['hdl-lettuce',100],['hdl-enoki',100]]},
 {id:'hdl-shrimp-ingredients',name:'海底捞 虾滑藕片组合（汤料另记）',category:'海底捞',items:[['hdl-shrimp-paste',1],['hdl-lotus',100],['hdl-potato',100]]}
);
`;
const file=path.resolve(__dirname,'../../nextstep-web/dist/foods.js');let source=fs.readFileSync(file,'utf8');
if(source.includes('const additionalFoodReferences='))throw Error('Expansion already present');
source=source.replace("const foodDataVersion='2026-10-24.1'","const foodDataVersion='2026-10-25.1'").replace('const foodBrowseGroups={',script+'\nconst foodBrowseGroups={').replace("'肯德基','老乡鸡'","'肯德基','必胜客','海底捞','老乡鸡'");
source=source.replace("const meatFoodIds=['chicken'","const meatFoodIds=['raw-shrimp','raw-tripe','raw-beef85','raw-ground-pork','roast-wing','chicken'");
source=source.replace('const rules=[','const rules=[[/葱油饼/,21],[/牛肚|毛肚|肥牛/,4],[/芝麻酱|腰果|南瓜籽/,34],[/烤翅/,26],[/芹菜|藕片|金针菇/,11],');
source=source.replace("const name=String(food?.name||''),id=food?.id||food?.foodId||'';","const name=String(food?.name||''),id=food?.id||food?.foodId||'';\n  const newSamples={'ph-beef-pasta':1,'ph-mushroom-pasta':1,'tomato-beef-noodles':1,'hdl-sesame-sauce':55,'tahini':55};if(Object.hasOwn(newSamples,id))return newSamples[id];");
fs.writeFileSync(file,source);
console.log(JSON.stringify({basic:foods.length,recipes:recipes.length,hotpot:hotpotFoods.length,added:foods.length+recipes.length+hotpotFoods.length}));
