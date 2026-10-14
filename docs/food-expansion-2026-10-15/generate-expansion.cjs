// Generates selected offline entries from the verified, compact SR28 reference file.
const fs=require('node:fs'),path=require('node:path');
const directory=__dirname,refs=JSON.parse(fs.readFileSync(path.join(directory,'usda-selected-references.json'),'utf8')).foods;
const definitions=[
 ['lettuce','生菜（罗马生菜）','蔬菜','11251',100,'可食生重，不含酱汁'],
 ['cucumber','黄瓜','蔬菜','11205',100,'带皮可食生重'],
 ['cabbage','包菜','蔬菜','11109',150,'可食生重，烹饪油另算'],
 ['napa-cabbage','大白菜','蔬菜','11119',150,'可食生重，烹饪油另算'],
 ['broccoli','西兰花','蔬菜','11090',150,'可食生重，烹饪油另算'],
 ['potato-raw','土豆（原料）','蔬菜','11352',100,'生重，不是炸薯条或熟成品重量'],
 ['onion','洋葱','蔬菜','11282',50,'可食生重'],
 ['mushroom','鲜蘑菇','蔬菜','11260',100,'白蘑菇可食生重；其他菌菇可能不同'],
 ['corn','甜玉米粒','主食','11168',100,'煮熟沥水，不含玉米芯与额外油'],
 ['edamame','毛豆仁','蛋白来源','11212',100,'熟可食部，不含豆荚'],
 ['rice-noodles','熟米粉','主食','20134',150,'煮熟沥水重量，不是干米粉重量'],
 ['tofu','嫩豆腐（未油炸）','蛋白来源','16427',150,'石膏豆腐原重参考，不含额外油'],
 ['cooked-beef','熟牛肉（配方参考）','蛋白来源','23568',100,'85%瘦肉/15%脂肪烤牛肉饼参考；牛肉部位不同会变化'],
 ['raw-pork-belly','五花肉（原料）','蛋白来源','10005',75,'可食生重，不能直接套用到熟肉重量'],
 ['cooked-pork','熟猪肉（肥瘦参考）','蛋白来源','10022',100,'猪里脊肥瘦合计烤制参考，熟可食部'],
 ['cooked-chicken-thigh','去皮熟鸡腿肉','蛋白来源','05098',100,'烤制熟可食部，不含骨、皮和额外酱汁'],
 ['full-milk','全脂牛奶（按克）','饮料','01077',250,'3.25%乳脂参考；此条按g记录，不把ml直接当g'],
 ['white-bread','白吐司','主食','18069',60,'商业白面包参考，按实际克重；两片60g仅快捷参考'],
 ['banana','香蕉','水果','09040',120,'可食生重，不含皮'],
 ['apple','苹果','水果','09003',180,'带皮可食生重，不含果核'],
 ['plain-yogurt','原味全脂酸奶','饮料','01116',200,'原味非加糖乳品参考，按g；调味酸奶请按标签修正'],
 ['peanut-butter','花生酱','调味','16098',15,'含盐顺滑花生酱参考，不是纯花生'],
 ['mozzarella','马苏里拉芝士','调味','01026',30,'全脂马苏里拉参考'],
 ['soy-sauce','酱油','调味','16123',10,'酿造酱油参考，按g；不能据热量判断钠摄入'],
 ['mayonnaise','蛋黄酱（沙拉酱参考）','调味','04025',15,'普通蛋黄酱参考；不是所有沙拉酱统一值'],
 ['cheese-pizza','芝士披萨（普通饼底）','披萨','21299',100,'14英寸连锁芝士披萨成分参考；按g，1片100g仅快捷参考，不等于特定店铺或所有尺寸'],
 ['thick-cheese-pizza','芝士披萨（厚饼底）','披萨','21300',100,'14英寸厚饼底参考；按实际克重，不按英寸推算整饼热量'],
 ['pepperoni-pizza','意式香肠披萨（普通饼底）','披萨','21302',100,'14英寸意式香肠披萨参考；按实际克重，非某品牌官方值'],
 ['tuna','水浸金枪鱼（沥水）','蛋白来源','15121',80,'采用SR28历史参考86kcal/100g；不是油浸或所有包装，以实际标签为准'],
 ['vinegar','红酒醋','调味','02068',10,'按g，不含额外糖；不能套用到加糖醋汁'],
 ['oats-dry','燕麦片（干重）','主食','08120',40,'干燕麦参考；泡水后的重量不能直接按干重算'],
 ['green-pepper','青椒','蔬菜','11333',100,'甜青椒可食生重，辣椒品种可能不同'],
 ['eggplant','茄子','蔬菜','11209',150,'可食生重，烹饪油另算']
];
const entries=definitions.map(([id,name,category,ndb,portion,note])=>{const ref=refs.find(r=>r.ndb===ndb);if(!ref)throw Error('Reference missing: '+ndb);return {id,name,category,ndb,portion,note,description:ref.description,kcal:ref.energyKcal}});
const file=path.resolve(directory,'../../nextstep-web/dist/foods.js');
let source=fs.readFileSync(file,'utf8');const marker='\n/* Food-library expansion: verified references and explicit recipe assumptions. */';if(source.includes(marker))throw Error('Expansion already present');
source+=marker+'\nconst expandedFoodReferences='+JSON.stringify(entries,null,2)+';\n'+String.raw`
for(const r of expandedFoodReferences){
  const entry=foodEntry(r.id,r.name,r.category,'g',100,r.kcal,r.portion,'sr28',r.note+'；USDA SR28 NDB '+r.ndb);
  entry.reference={ndb:r.ndb,description:r.description,kcalPer100g:r.kcal};foodCatalog.push(entry);
}
function foodRecipe(id,name,category,parts,note,aliases=[],menuSource=null){
  const components=parts.map(([foodId,quantity])=>{const f=foodCatalog.find(f=>f.id===foodId);if(!f||f.basis.energyKcal===null||!Number.isFinite(quantity)||quantity<=0)throw Error('Invalid recipe component '+foodId);return {foodId,name:f.name,quantity,unit:f.unit,basis:{...f.basis},energyKcal:quantity/f.basis.amount*f.basis.energyKcal,source:f.source,reference:f.reference||null,note:f.note}});
  const total=components.reduce((sum,c)=>sum+c.energyKcal,0);
  const entry=foodEntry(id,name,category,'份',1,total,1,menuSource?'storeRecipe':'recipe','参考配方；'+note,aliases);
  entry.recipe={components,totalKcal:total,description:'仅按本参考配方合计；原料生重/熟重分别注明，不由成品总克重反推。'};
  entry.menuSource=menuSource;foodCatalog.push(entry);return entry;
}
const storeMenus={
  lxj:{name:'老乡鸡公开菜品',url:'https://lxjchina.com.cn/',scope:'菜名参考；配方条目不是品牌官方营养值'},
  rice:{name:'大米先生官方招牌菜介绍',url:'https://www.csc100.com/index/category/dmxsjdcp.html',scope:'确认辣椒炒肉、爆炒牛肉等菜名，不提供热量；本应用配方为估算'},
  micun:{name:'米村拌饭官方菜品',url:'https://www.micun.com/food/',scope:'仅确认菜名，不提供热量；本应用配方为估算'},
  ygf:{name:'杨国福品牌与自选模式',url:'https://ygfglobal.com/cn/aboutus',scope:'确认自选麻辣烫模式，不提供一碗统一热量；本应用搭配为估算'}
};
for(const [id,name,kcal,portion]of [
 ['lxj-chicken-soup','老乡鸡 金牌老母鸡汤',30,300],
 ['lxj-winter-soup','老乡鸡 冬瓜马蹄鸡汤',14,300],
 ['lxj-scallion-chicken','老乡鸡 葱油鸡',183,150],
 ['lxj-edamame-chicken','老乡鸡 经典毛豆烧鸡',172,150],
 ['lxj-broccoli-chicken','老乡鸡 西兰花炒鸡胸肉',94,150]
])foodCatalog.push(foodEntry(id,name,'老乡鸡','g',100,kcal,portion,'lxj','品牌2026-07-04公开每100g参考；'+portion+'g是本应用快捷份重，非官方每份；按实际食用量和门店称重口径调整'));

foodRecipe('lxj-steamed-egg','老乡鸡 农家蒸蛋（配方估算）','老乡鸡',[['egg',1],['water',100],['oil',2]],'按1个鸡蛋可食50g的熟蛋参考加水和2g油近似；成品份重未核实，不含米饭；非官方营养值',[],storeMenus.lxj);
foodRecipe('lxj-cabbage-tofu','老乡鸡 白菜炖豆腐（配方估算）','老乡鸡',[['napa-cabbage',150],['tofu',150],['oil',5],['soy-sauce',10]],'白菜生重150g＋豆腐原重150g＋油5g＋酱油10g；不含饭；非官方配方',[],storeMenus.lxj);
foodRecipe('dmxs-pepper-pork','大米先生 辣椒炒肉（配方估算）','大米先生',[['cooked-pork',100],['green-pepper',100],['oil',10],['soy-sauce',10]],'熟肥瘦猪肉100g＋生青椒100g＋油10g＋酱油10g；不含饭；实际肉类肥瘦和份量未核实',['小炒肉'],storeMenus.rice);
foodRecipe('dmxs-potato-pork','大米先生 土豆红烧肉（配方估算）','大米先生',[['raw-pork-belly',70],['potato-raw',100],['oil',5],['sugar',6],['soy-sauce',10]],'五花肉生重70g＋土豆生重100g＋油5g＋糖6g＋酱油10g；按投入油脂全计，实际留锅油另有差异；不含饭',[],storeMenus.rice);
foodRecipe('dmxs-beef','大米先生 爆炒牛肉（配方估算）','大米先生',[['cooked-beef',80],['green-pepper',100],['onion',50],['oil',10],['soy-sauce',10]],'熟牛肉参考80g＋生青椒100g＋洋葱50g＋油10g＋酱油10g；牛肉用85%瘦肉烤制参考近似，门店部位未核实；不含饭',[],storeMenus.rice);
foodRecipe('dmxs-cabbage','大米先生 自选清炒包菜（配方估算）','大米先生',[['cabbage',150],['oil',8],['soy-sauce',10]],'自选小碗搭配参考：包菜生重150g＋油8g＋酱油10g；菜式以当店为准；不含饭',[],storeMenus.rice);
foodRecipe('dmxs-tomato-egg','大米先生 自选番茄炒蛋（配方估算）','大米先生',[['tomato-egg',0.6]],'沿用家常番茄炒蛋参考配方的0.6份，鸡蛋/油随份量缩放；菜式以当店为准；不含饭',[],storeMenus.rice);

foodRecipe('micun-beef-rice','米村 烤牛肉石锅拌饭（含饭估算）','米村拌饭',[['rice',250],['cooked-beef',80],['lettuce',100],['egg',1],['oil',8],['sugar',5],['soy-sauce',10]],'含熟米饭250g；熟牛肉用85%瘦肉参考80g近似＋蔬菜100g＋蛋1个＋油8g＋糖5g＋酱油10g；品牌实际份重和拌酱未核实，勿重复加饭',['米村拌饭','牛肉拌饭'],storeMenus.micun);
foodRecipe('micun-chicken-rice','米村 照烧鸡腿肉石锅拌饭（含饭估算）','米村拌饭',[['rice',250],['cooked-chicken-thigh',120],['lettuce',100],['oil',10],['sugar',10],['soy-sauce',15]],'含熟米饭250g＋去皮熟鸡腿肉120g＋生菜100g＋油10g＋糖10g＋酱油15g；照烧酱为独立参考，勿重复加饭',[],storeMenus.micun);
foodRecipe('micun-tuna-rice','米村 金枪鱼拌饭（含饭估算）','米村拌饭',[['rice',200],['tuna',80],['lettuce',100],['egg',1],['mayonnaise',15]],'含熟米饭200g＋水浸沥水鱼肉80g＋生菜100g＋蛋1个＋蛋黄酱15g；不是油浸鱼或品牌配方，勿重复加饭',[],storeMenus.micun);
foodRecipe('micun-egg-rice','米村 石板鸡蛋配饭（含饭估算）','米村拌饭',[['rice',200],['egg',2],['oil',10],['cabbage',100]],'含熟米饭200g＋按熟蛋参考2个＋油10g＋蔬菜生重100g；勿重复加饭；非门店标准份',[],storeMenus.micun);
foodRecipe('micun-tofu-rice','米村 石板肉酱豆腐配饭（含饭估算）','米村拌饭',[['rice',200],['tofu',150],['cooked-beef',30],['oil',10],['soy-sauce',10]],'含熟米饭200g＋豆腐原重150g＋熟牛肉参考30g＋油10g＋酱油10g；肉酱种类未核实；勿重复加饭',[],storeMenus.micun);

foodRecipe('ygf-vegetables','杨国福 自选蔬菜豆腐（食材估算）','杨国福',[['napa-cabbage',150],['mushroom',100],['tofu',150]],'白菜生重150g＋鲜蘑菇生重100g＋豆腐原重150g；仅食材，不含主食、汤底、蘸料；按自选量修改',[],storeMenus.ygf);
foodRecipe('ygf-broth','杨国福 汤底食用量（配方参考）','杨国福',[['full-milk',30],['oil',3],['water',250]],'独立参考牛奶30g＋油3g＋水250ml，非品牌骨汤配方；1份表示参考汤汁全部食用；不喝汤仍可能有附着油，不自动归零',[],storeMenus.ygf);
foodRecipe('ygf-malatang','杨国福 鸡肉豆腐麻辣烫（整碗估算）','杨国福',[['ygf-vegetables',1],['chicken',100],['rice-noodles',150],['ygf-broth',1]],'含蔬菜豆腐食材、熟鸡胸100g、熟米粉150g、参考汤底1份；整碗参考，不是称菜重量直接换算；勿再重复计分项',['麻辣烫'],storeMenus.ygf);
foodRecipe('ygf-mala-mix','杨国福 自选麻辣拌（配方估算）','杨国福',[['chicken',120],['potato-raw',100],['napa-cabbage',150],['oil',15],['sugar',5],['soy-sauce',15]],'熟鸡胸120g＋土豆生重100g＋白菜生重150g＋油15g＋糖5g＋酱油15g；不含额外主食；按实际自选和酱料修改',['麻辣拌'],storeMenus.ygf);

foodRecipe('dry-pot-mixed','麻辣香锅 荤素搭配（不含饭）','麻辣香锅',[['chicken',150],['potato-raw',100],['mushroom',100],['napa-cabbage',150],['oil',25],['soy-sauce',15],['sugar',5]],'熟鸡胸150g＋土豆生重100g＋蘑菇100g＋白菜150g＋油25g＋酱油15g＋糖5g；不含米饭，留锅油和实际吸油量会改变结果',['麻辣香锅','香锅']);
foodRecipe('dry-pot-tofu','麻辣香锅 豆腐菌菇（不含饭）','麻辣香锅',[['tofu',200],['mushroom',150],['napa-cabbage',150],['corn',100],['oil',20],['soy-sauce',15]],'豆腐原重200g＋蘑菇生重150g＋白菜生重150g＋熟玉米粒100g＋油20g＋酱油15g；不含饭',['素香锅']);
foodRecipe('salad-veg','蔬菜玉米沙拉（不含酱）','沙拉',[['lettuce',150],['cucumber',100],['tomato',100],['corn',80]],'生菜150g＋黄瓜100g＋番茄100g＋熟玉米粒80g；不含沙拉酱或主食',['蔬菜沙拉','轻食']);
foodRecipe('salad-chicken','鸡胸肉沙拉（不含酱）','沙拉',[['lettuce',100],['cucumber',100],['tomato',100],['chicken',100],['corn',80]],'生菜100g＋黄瓜100g＋番茄100g＋熟鸡胸100g＋熟玉米粒80g；不含酱，酱汁单独选择',['鸡肉沙拉','轻食']);
foodRecipe('salad-tuna','金枪鱼鸡蛋沙拉（不含酱）','沙拉',[['lettuce',100],['cucumber',100],['tomato',100],['tuna',80],['egg',1]],'生菜100g＋黄瓜100g＋番茄100g＋水浸沥水鱼肉80g＋蛋1个；不含酱',['轻食']);
foodRecipe('vinaigrette','油醋汁（配方估算）','调味',[['oil',8],['vinegar',10],['sugar',3]],'食用油8g＋红酒醋10g＋糖3g；本参考1份，品牌或无油酱汁请另填');
foodRecipe('sesame-style-sauce','花生酱蘸料（配方参考）','调味',[['peanut-butter',15],['soy-sauce',5],['water',10]],'花生酱15g＋酱油5g＋水10ml；不能冒充纯芝麻酱或店铺官方蘸料',['麻酱','蘸料']);
foodRecipe('home-fried-rice','鸡蛋炒饭（配方估算）','家常',[['rice',250],['egg',1],['onion',30],['oil',12],['soy-sauce',10]],'熟米饭250g＋蛋1个＋洋葱生重30g＋油12g＋酱油10g；饭已包含',['蛋炒饭']);
foodRecipe('home-tomato-pasta','番茄鸡肉意面（配方估算）','意面',[['pasta',200],['chicken',80],['tomato',100],['oil',8]],'熟意面200g＋熟鸡胸80g＋番茄生重100g＋油8g；面和酱已计入',['意大利面']);
foodRecipe('home-stir-eggplant','肉末茄子（配方估算）','家常',[['eggplant',200],['cooked-beef',40],['oil',20],['soy-sauce',10]],'茄子生重200g＋熟牛肉参考40g＋油20g＋酱油10g；不含米饭；吸油量会明显改变结果');

foodCombos.push(
 {id:'lxj-lunch',name:'老乡鸡 葱油鸡＋鸡汤配饭',category:'老乡鸡',items:[['lxj-scallion-chicken',150],['lxj-chicken-soup',300],['rice',150]]},
 {id:'lxj-broccoli-lunch',name:'老乡鸡 西兰花鸡胸肉配饭',category:'老乡鸡',items:[['lxj-broccoli-chicken',150],['lxj-winter-soup',300],['rice',150]]},
 {id:'dmxs-pork-lunch',name:'大米先生 辣椒炒肉配饭',category:'大米先生',items:[['dmxs-pepper-pork',1],['rice',200]]},
 {id:'dmxs-beef-lunch',name:'大米先生 牛肉包菜配饭',category:'大米先生',items:[['dmxs-beef',1],['dmxs-cabbage',1],['rice',200]]},
 {id:'micun-beef-lunch',name:'米村 烤牛肉拌饭（饭已包含）',category:'米村拌饭',items:[['micun-beef-rice',1],['water',250]]},
 {id:'micun-chicken-lunch',name:'米村 照烧鸡腿拌饭（饭已包含）',category:'米村拌饭',items:[['micun-chicken-rice',1],['water',250]]},
 {id:'ygf-custom-bowl',name:'杨国福 自选鸡肉豆腐米粉',category:'杨国福',items:[['ygf-vegetables',1],['chicken',100],['rice-noodles',150],['ygf-broth',1]]},
 {id:'dry-pot-rice',name:'荤素麻辣香锅配饭',category:'麻辣香锅',items:[['dry-pot-mixed',1],['rice',200]]},
 {id:'dry-pot-tofu-rice',name:'豆腐菌菇香锅配饭',category:'麻辣香锅',items:[['dry-pot-tofu',1],['rice',150]]},
 {id:'salad-chicken-dressing',name:'鸡胸肉沙拉＋油醋汁',category:'沙拉',items:[['salad-chicken',1],['vinaigrette',1]]},
 {id:'salad-tuna-dressing',name:'金枪鱼鸡蛋沙拉＋蛋黄酱',category:'沙拉',items:[['salad-tuna',1],['mayonnaise',15]]},
 {id:'pizza-two-slices',name:'芝士披萨两片（参考共200g）',category:'披萨',items:[['cheese-pizza',200],['water',250]]},
 {id:'breakfast-oats-milk',name:'牛奶燕麦早餐',category:'早餐',items:[['full-milk',250],['oats-dry',40],['banana',120]]}
);
`;
fs.writeFileSync(file,source);console.log('Added '+entries.length+' verified food references plus recipe and store entries.');
