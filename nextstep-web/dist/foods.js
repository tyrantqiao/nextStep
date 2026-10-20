/* Offline references. Recipe portions are editable, never personal measurements. */
const foodDataVersion='2026-10-20.1';
const foodSources={
  gangrongLabel:{type:'包装标签参考',name:'用户提供的港荣淡糖蒸蛋糕包装照片',url:null,license:'按本次包装营养表录入；每100g，实际包装为准。单个重量未提供，需按实际食用克数填写。'},
  grains:{type:'食物成分参考',name:'USDA Standard Reference 28 · 谷物与意面',url:'https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg20.pdf',license:'USDA 公共领域数据；仅选用基础食物参考值'},
  eggs:{type:'食物成分参考',name:'USDA SR28 · 鸡蛋 NDB 01129',url:'https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR/SR28/reports/sr28fg01.pdf',license:'USDA 公共领域数据'},
  chicken:{type:'食物成分参考',name:'USDA · 烤去皮鸡胸肉 NDB 05064',url:'https://www.ars.usda.gov/ARSUserFiles/80400525/articles/ift2006_chicken.pdf',license:'USDA 基础成分参考'},
  recipe:{type:'配方估算',name:'NextStep 参考配方',url:null,license:'独立参考配方；实际含水量、油和食材会改变热量'},
  cola:{type:'包装标签参考',name:'可口可乐 · 330ml · 6928804014570 · 180kJ/100ml',url:'https://nlc.chinanutri.cn/food/Ok7S31KVS2Kh7WcIuS2Ykw.html',license:'单个标签事实参考，实际包装为准；未复制完整数据库'},
  sprite:{type:'包装标签参考',name:'雪碧 · 600ml · 6954767434674 · 191kJ/100ml',url:'https://nlc.chinanutri.cn/food/402881eb55a45f0f0155a4876b5a6df4.html',license:'单个标签事实参考，实际包装为准；未复制完整数据库'},
  pending:{type:'待填写热量',name:'尚未核实当前大陆规格的热量',url:null,license:'请按包装或点餐页填写；未知热量不计作零'},
  manual:{type:'用户手填',name:'用户输入的热量或标签',url:null,license:'按用户填写保存，不代表实测'},
  sr28:{type:'食物成分参考',name:'USDA Standard Reference 28 · 食品简表',url:'https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/SR28/dnload/sr28abbr.zip',license:'USDA 公共领域数据；按每100g可食部。美国参考食物不等于某家中国门店的实测值。'},
  lxj:{type:'品牌公开营养参考',name:'老乡鸡官方微博 · 2026-07-04（新浪展示原帖）',url:'https://www.sina.cn/news/detail/5317006036573511.html',license:'品牌公开的单项营养事实，每100g；快捷份重由本应用设置，可按实际食用量修改，不是门店官方每份克重。'},
  storeRecipe:{type:'店铺搭配估算',name:'NextStep 店铺参考搭配',url:'https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/SR28/dnload/sr28abbr.zip',license:'按注明的食材、油和酱料假设计算，非门店官方营养值。原料克重与成品克重不混用；实际食材、份量与用油会改变热量。'}
};
function foodEntry(id,name,category,unit,amount,kcal,portion,source,note,aliases=[]){return {id,name,category,unit,basis:{amount,unit,energyKcal:kcal},portion,source,note,aliases,region:'CN',dataVersion:foodDataVersion,checkedAt:kcal===null?null:'2026-10-15'}}
const foodCatalog=[
  foodEntry('rice','米饭','主食','g',100,130,150,'grains','熟重，可食部；长粒白米参考 NDB 20445，1碗参考150g',['白米饭','白饭']),
  foodEntry('brown-rice','糙米饭','主食','g',100,123,150,'grains','熟重；长粒糙米参考 NDB 20037，实际含水量会不同'),
  foodEntry('mixed-rice','杂粮饭（白米＋糙米）','主食','g',100,128.25,150,'recipe','熟饭参考配方：白米75g×1.30＋糙米25g×1.23；不是所有杂粮饭统一值',['杂粮饭','粗粮饭']),
  foodEntry('pasta','原味意面','主食','g',100,158,200,'grains','煮熟沥水重量，不含酱汁；NDB 20121',['意大利面','面条']),
  foodEntry('egg','水煮鸡蛋','蛋白来源','个',1,77.5,1,'eggs','1个参考可食50g×155kcal/100g，不含蛋壳',['鸡蛋']),
  foodEntry('chicken','去皮烤鸡胸肉','蛋白来源','g',100,165,150,'chicken','熟可食部，不含额外酱汁',['鸡肉','鸡胸']),
  foodEntry('tomato-egg','番茄炒蛋（参考配方）','家常','份',1,218,1,'recipe','参考一份：可食鸡蛋100g按155＋番茄100g按18＋油5g按45；原料重量，成品份量会变化',['西红柿炒鸡蛋']),
  foodEntry('tomato','番茄','蔬菜','g',100,18,200,'recipe','基础食材参考18kcal/100g；可食生重，见USDA NDB 11529与来源说明',['西红柿']),
  foodEntry('oil','额外食用油','调味','g',1,9,5,'recipe','只记录配方以外额外添加的油；9kcal/g'),
  foodEntry('sugar','额外白糖','调味','g',1,4,5,'recipe','只记录配方以外额外添加的糖；4kcal/g'),
  foodEntry('cola','可口可乐（有糖标签参考）','饮料','ml',100,180/4.184,330,'cola','净饮用量，不把冰块当饮料；规格和配方以包装为准',['可乐']),
  foodEntry('sprite','雪碧（有糖标签参考）','饮料','ml',100,191/4.184,600,'sprite','净饮用量；600ml标签实例，其他配方以包装为准'),
  foodEntry('water','水','饮料','ml',100,0,250,'recipe','纯水，不含糖或奶'),
  foodEntry('lemon-tea','柠檬茶（茶＋糖参考配方）','饮料','份',1,102,1,'recipe','参考一杯：原茶240ml约2＋糖25g约100；柠檬、糖浆或其他配料另记，不等同品牌瓶装',['柠檬茶','红茶']),
  ...[['zero-cola','无糖可乐'],['zero-sprite','无糖雪碧'],['bottle-tea','瓶装柠檬茶']].map(([id,name])=>foodEntry(id,name,'饮料','ml',100,null,330,'pending','按实际包装每100ml标签填写')),
  ...[['mc-bigmac','麦当劳 巨无霸'],['mc-chicken','麦当劳 麦香鸡'],['mc-grilled','麦当劳 板烧鸡腿堡'],['kfc-spicy','肯德基 香辣鸡腿堡'],['kfc-grilled','肯德基 新奥尔良烤鸡腿堡'],['kfc-tart','肯德基 葡式蛋挞']].map(([id,name])=>foodEntry(id,name,id.startsWith('mc')?'麦当劳':'肯德基','个',1,null,1,'pending','中国大陆候选，当前热量待核实；请按官方点餐信息填写',[id.startsWith('mc')?'麦记':'KFC','汉堡','蛋挞'].filter(a=>a!=='蛋挞'||id==='kfc-tart'))),
  ...['mc','kfc'].flatMap(brand=>[['small','小'],['medium','中'],['large','大']].map(([size,label])=>foodEntry(brand+'-fries-'+size,(brand==='mc'?'麦当劳':'肯德基')+' 薯条（'+label+'份）',brand==='mc'?'麦当劳':'肯德基','份',1,null,1,'pending','规格独立；不含额外蘸酱，热量请按点餐页填写',['薯条',brand==='mc'?'麦记':'KFC']))),
  foodEntry('mc-nuggets','麦当劳 麦乐鸡（5块）','麦当劳','块',5,null,5,'pending','大陆5块规格，热量待填写；不含额外蘸酱',['鸡块','麦记']),
  foodEntry('kfc-nuggets','肯德基 上校鸡块','肯德基','块',1,null,5,'pending','块数可改，按实际规格填写热量；不含额外蘸酱',['鸡块','KFC'])
];
const foodCombos=[
  {id:'mixed-egg',name:'杂粮饭番茄炒蛋',category:'家常',items:[['mixed-rice',150],['tomato-egg',1]]},
  {id:'rice-chicken',name:'米饭鸡肉番茄餐',category:'家常',items:[['rice',150],['chicken',150],['tomato',200]]},
  {id:'pasta-egg',name:'意面番茄炒蛋餐',category:'意面',items:[['pasta',200],['tomato-egg',1]]},
  {id:'mc-meal',name:'麦当劳 汉堡薯条组合',category:'麦当劳',items:[['mc-bigmac',1],['mc-fries-medium',1],['cola',330]]},
  {id:'mc-nugget-meal',name:'麦当劳 板烧鸡腿堡＋鸡块',category:'麦当劳',items:[['mc-grilled',1],['mc-nuggets',5],['water',250]]},
  {id:'kfc-meal',name:'肯德基 汉堡薯条组合',category:'肯德基',items:[['kfc-spicy',1],['kfc-fries-medium',1],['sprite',330]]},
  {id:'kfc-snack',name:'肯德基 蛋挞鸡块组合',category:'肯德基',items:[['kfc-tart',2],['kfc-nuggets',5],['bottle-tea',500]]}
];

/* Food-library expansion: verified references and explicit recipe assumptions. */
const expandedFoodReferences=[
  {
    "id": "lettuce",
    "name": "生菜（罗马生菜）",
    "category": "蔬菜",
    "ndb": "11251",
    "portion": 100,
    "note": "可食生重，不含酱汁",
    "description": "LETTUCE,COS OR ROMAINE,RAW",
    "kcal": 17
  },
  {
    "id": "cucumber",
    "name": "黄瓜",
    "category": "蔬菜",
    "ndb": "11205",
    "portion": 100,
    "note": "带皮可食生重",
    "description": "CUCUMBER,WITH PEEL,RAW",
    "kcal": 15
  },
  {
    "id": "cabbage",
    "name": "包菜",
    "category": "蔬菜",
    "ndb": "11109",
    "portion": 150,
    "note": "可食生重，烹饪油另算",
    "description": "CABBAGE,RAW",
    "kcal": 25
  },
  {
    "id": "napa-cabbage",
    "name": "大白菜",
    "category": "蔬菜",
    "ndb": "11119",
    "portion": 150,
    "note": "可食生重，烹饪油另算",
    "description": "CABBAGE,CHINESE (PE-TSAI),RAW",
    "kcal": 16
  },
  {
    "id": "broccoli",
    "name": "西兰花",
    "category": "蔬菜",
    "ndb": "11090",
    "portion": 150,
    "note": "可食生重，烹饪油另算",
    "description": "BROCCOLI,RAW",
    "kcal": 34
  },
  {
    "id": "potato-raw",
    "name": "土豆（原料）",
    "category": "蔬菜",
    "ndb": "11352",
    "portion": 100,
    "note": "生重，不是炸薯条或熟成品重量",
    "description": "POTATOES,FLESH & SKN,RAW",
    "kcal": 77
  },
  {
    "id": "onion",
    "name": "洋葱",
    "category": "蔬菜",
    "ndb": "11282",
    "portion": 50,
    "note": "可食生重",
    "description": "ONIONS,RAW",
    "kcal": 40
  },
  {
    "id": "mushroom",
    "name": "鲜蘑菇",
    "category": "蔬菜",
    "ndb": "11260",
    "portion": 100,
    "note": "白蘑菇可食生重；其他菌菇可能不同",
    "description": "MUSHROOMS,WHITE,RAW",
    "kcal": 22
  },
  {
    "id": "corn",
    "name": "甜玉米粒",
    "category": "主食",
    "ndb": "11168",
    "portion": 100,
    "note": "煮熟沥水，不含玉米芯与额外油",
    "description": "CORN,SWT,YEL,CKD,BLD,DRND,WO/SALT",
    "kcal": 96
  },
  {
    "id": "edamame",
    "name": "毛豆仁",
    "category": "蛋白来源",
    "ndb": "11212",
    "portion": 100,
    "note": "熟可食部，不含豆荚",
    "description": "EDAMAME,FRZ,PREP",
    "kcal": 121
  },
  {
    "id": "rice-noodles",
    "name": "熟米粉",
    "category": "主食",
    "ndb": "20134",
    "portion": 150,
    "note": "煮熟沥水重量，不是干米粉重量",
    "description": "RICE NOODLES,CKD",
    "kcal": 108
  },
  {
    "id": "tofu",
    "name": "嫩豆腐（未油炸）",
    "category": "蛋白来源",
    "ndb": "16427",
    "portion": 150,
    "note": "石膏豆腐原重参考，不含额外油",
    "description": "TOFU,RAW,REG,PREP W/CA SULFATE",
    "kcal": 76
  },
  {
    "id": "cooked-beef",
    "name": "熟牛肉（配方参考）",
    "category": "蛋白来源",
    "ndb": "23568",
    "portion": 100,
    "note": "85%瘦肉/15%脂肪烤牛肉饼参考；牛肉部位不同会变化",
    "description": "BEEF,GROUND,85% LN MEAT / 15% FAT,PATTY,CKD,BRLD",
    "kcal": 250
  },
  {
    "id": "raw-pork-belly",
    "name": "五花肉（原料）",
    "category": "蛋白来源",
    "ndb": "10005",
    "portion": 75,
    "note": "可食生重，不能直接套用到熟肉重量",
    "description": "PORK,FRSH,BELLY,RAW",
    "kcal": 518
  },
  {
    "id": "cooked-pork",
    "name": "熟猪肉（肥瘦参考）",
    "category": "蛋白来源",
    "ndb": "10022",
    "portion": 100,
    "note": "猪里脊肥瘦合计烤制参考，熟可食部",
    "description": "PORK,FRSH,LOIN,WHL,LN&FAT,CKD,BRLD",
    "kcal": 242
  },
  {
    "id": "cooked-chicken-thigh",
    "name": "去皮熟鸡腿肉",
    "category": "蛋白来源",
    "ndb": "05098",
    "portion": 100,
    "note": "烤制熟可食部，不含骨、皮和额外酱汁",
    "description": "CHICKEN,BROILERS OR FRYERS,THIGH,MEAT ONLY,CKD,RSTD",
    "kcal": 179
  },
  {
    "id": "full-milk",
    "name": "全脂牛奶（按克）",
    "category": "饮料",
    "ndb": "01077",
    "portion": 250,
    "note": "3.25%乳脂参考；此条按g记录，不把ml直接当g",
    "description": "MILK,WHL,3.25% MILKFAT,W/ ADDED VITAMIN D",
    "kcal": 61
  },
  {
    "id": "white-bread",
    "name": "白吐司",
    "category": "主食",
    "ndb": "18069",
    "portion": 60,
    "note": "商业白面包参考，按实际克重；两片60g仅快捷参考",
    "description": "BREAD,WHITE,COMMLY PREP (INCL SOFT BREAD CRUMBS)",
    "kcal": 266
  },
  {
    "id": "banana",
    "name": "香蕉",
    "category": "水果",
    "ndb": "09040",
    "portion": 120,
    "note": "可食生重，不含皮",
    "description": "BANANAS,RAW",
    "kcal": 89
  },
  {
    "id": "apple",
    "name": "苹果",
    "category": "水果",
    "ndb": "09003",
    "portion": 180,
    "note": "带皮可食生重，不含果核",
    "description": "APPLES,RAW,WITH SKIN",
    "kcal": 52
  },
  {
    "id": "plain-yogurt",
    "name": "原味全脂酸奶",
    "category": "饮料",
    "ndb": "01116",
    "portion": 200,
    "note": "原味非加糖乳品参考，按g；调味酸奶请按标签修正",
    "description": "YOGURT,PLN,WHL MILK,8 GRAMS PROT PER 8 OZ",
    "kcal": 61
  },
  {
    "id": "peanut-butter",
    "name": "花生酱",
    "category": "调味",
    "ndb": "16098",
    "portion": 15,
    "note": "含盐顺滑花生酱参考，不是纯花生",
    "description": "PEANUT BUTTER,SMOOTH STYLE,W/ SALT",
    "kcal": 598
  },
  {
    "id": "mozzarella",
    "name": "马苏里拉芝士",
    "category": "调味",
    "ndb": "01026",
    "portion": 30,
    "note": "全脂马苏里拉参考",
    "description": "CHEESE,MOZZARELLA,WHL MILK",
    "kcal": 300
  },
  {
    "id": "soy-sauce",
    "name": "酱油",
    "category": "调味",
    "ndb": "16123",
    "portion": 10,
    "note": "酿造酱油参考，按g；不能据热量判断钠摄入",
    "description": "SOY SAU MADE FROM SOY&WHEAT (SHOYU)",
    "kcal": 53
  },
  {
    "id": "mayonnaise",
    "name": "蛋黄酱（沙拉酱参考）",
    "category": "调味",
    "ndb": "04025",
    "portion": 15,
    "note": "普通蛋黄酱参考；不是所有沙拉酱统一值",
    "description": "SALAD DRSNG,MAYO,REG",
    "kcal": 680
  },
  {
    "id": "cheese-pizza",
    "name": "芝士披萨（普通饼底）",
    "category": "披萨",
    "ndb": "21299",
    "portion": 100,
    "note": "14英寸连锁芝士披萨成分参考；按g，1片100g仅快捷参考，不等于特定店铺或所有尺寸",
    "description": "FAST FD,PIZZA CHAIN,14\" PIZZA,CHS TOPPING,REG CRUST",
    "kcal": 266
  },
  {
    "id": "thick-cheese-pizza",
    "name": "芝士披萨（厚饼底）",
    "category": "披萨",
    "ndb": "21300",
    "portion": 100,
    "note": "14英寸厚饼底参考；按实际克重，不按英寸推算整饼热量",
    "description": "FAST FD,PIZZA CHAIN,14\" PIZZA,CHS TOPPING,THICK CRUST",
    "kcal": 271
  },
  {
    "id": "pepperoni-pizza",
    "name": "意式香肠披萨（普通饼底）",
    "category": "披萨",
    "ndb": "21302",
    "portion": 100,
    "note": "14英寸意式香肠披萨参考；按实际克重，非某品牌官方值",
    "description": "FAST FD,PIZZA CHAIN,14\" PIZZA,PEPPERONI TOPPING,REG CRUST",
    "kcal": 282
  },
  {
    "id": "tuna",
    "name": "水浸金枪鱼（沥水）",
    "category": "蛋白来源",
    "ndb": "15121",
    "portion": 80,
    "note": "采用SR28历史参考86kcal/100g；不是油浸或所有包装，以实际标签为准",
    "description": "FISH,TUNA,LT,CND IN H2O,DRND SOL",
    "kcal": 86
  },
  {
    "id": "vinegar",
    "name": "红酒醋",
    "category": "调味",
    "ndb": "02068",
    "portion": 10,
    "note": "按g，不含额外糖；不能套用到加糖醋汁",
    "description": "VINEGAR,RED WINE",
    "kcal": 19
  },
  {
    "id": "oats-dry",
    "name": "燕麦片（干重）",
    "category": "主食",
    "ndb": "08120",
    "portion": 40,
    "note": "干燕麦参考；泡水后的重量不能直接按干重算",
    "description": "CEREALS,OATS,REG & QUICK,NOT FORT,DRY",
    "kcal": 379
  },
  {
    "id": "green-pepper",
    "name": "青椒",
    "category": "蔬菜",
    "ndb": "11333",
    "portion": 100,
    "note": "甜青椒可食生重，辣椒品种可能不同",
    "description": "PEPPERS,SWT,GRN,RAW",
    "kcal": 20
  },
  {
    "id": "eggplant",
    "name": "茄子",
    "category": "蔬菜",
    "ndb": "11209",
    "portion": 150,
    "note": "可食生重，烹饪油另算",
    "description": "EGGPLANT,RAW",
    "kcal": 25
  }
];

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

/* Everyday foods: verified USDA SR28 edible-portion references. */
const everydayFoodReferences=[
  {
    "id": "orange",
    "name": "橙子",
    "category": "水果",
    "ndb": "09200",
    "portion": 150,
    "note": "去皮可食生重",
    "description": "ORANGES,RAW,ALL COMM VAR",
    "kcal": 47
  },
  {
    "id": "mandarin",
    "name": "橘子",
    "category": "水果",
    "ndb": "09218",
    "portion": 100,
    "note": "去皮可食生重",
    "description": "TANGERINES,(MANDARIN ORANGES),RAW",
    "kcal": 53
  },
  {
    "id": "pineapple",
    "name": "菠萝",
    "category": "水果",
    "ndb": "09266",
    "portion": 150,
    "note": "去皮可食生重",
    "description": "PINEAPPLE,RAW,ALL VAR",
    "kcal": 50
  },
  {
    "id": "strawberry",
    "name": "草莓",
    "category": "水果",
    "ndb": "09316",
    "portion": 150,
    "note": "去蒂可食生重",
    "description": "STRAWBERRIES,RAW",
    "kcal": 32
  },
  {
    "id": "blueberry",
    "name": "蓝莓",
    "category": "水果",
    "ndb": "09050",
    "portion": 100,
    "note": "可食生重",
    "description": "BLUEBERRIES,RAW",
    "kcal": 57
  },
  {
    "id": "grape",
    "name": "葡萄",
    "category": "水果",
    "ndb": "09132",
    "portion": 100,
    "note": "红或绿无籽葡萄，可食生重",
    "description": "GRAPES,RED OR GRN (EURO TYPE,SUCH AS THOMPSON SEEDLESS),RAW",
    "kcal": 69
  },
  {
    "id": "kiwi",
    "name": "猕猴桃",
    "category": "水果",
    "ndb": "09148",
    "portion": 100,
    "note": "绿心，去皮可食生重",
    "description": "KIWIFRUIT,GRN,RAW",
    "kcal": 61
  },
  {
    "id": "watermelon",
    "name": "西瓜",
    "category": "水果",
    "ndb": "09326",
    "portion": 250,
    "note": "去皮可食生重",
    "description": "WATERMELON,RAW",
    "kcal": 30
  },
  {
    "id": "pear",
    "name": "梨",
    "category": "水果",
    "ndb": "09252",
    "portion": 180,
    "note": "可食生重，去核",
    "description": "PEARS,RAW",
    "kcal": 57
  },
  {
    "id": "mango",
    "name": "芒果",
    "category": "水果",
    "ndb": "09176",
    "portion": 150,
    "note": "去皮去核可食生重",
    "description": "MANGOS,RAW",
    "kcal": 60
  },
  {
    "id": "peach",
    "name": "桃子",
    "category": "水果",
    "ndb": "09236",
    "portion": 150,
    "note": "黄桃参考，去核可食生重",
    "description": "PEACHES,YEL,RAW",
    "kcal": 39
  },
  {
    "id": "spinach",
    "name": "菠菜",
    "category": "蔬菜",
    "ndb": "11457",
    "portion": 150,
    "note": "可食生重，烹饪油另记",
    "description": "SPINACH,RAW",
    "kcal": 23
  },
  {
    "id": "carrot",
    "name": "胡萝卜",
    "category": "蔬菜",
    "ndb": "11124",
    "portion": 100,
    "note": "可食生重，烹饪油另记",
    "description": "CARROTS,RAW",
    "kcal": 41
  },
  {
    "id": "bok-choy",
    "name": "小白菜",
    "category": "蔬菜",
    "ndb": "11116",
    "portion": 150,
    "note": "可食生重，烹饪油另记",
    "description": "CABBAGE,CHINESE (PAK-CHOI),RAW",
    "kcal": 13
  },
  {
    "id": "zucchini",
    "name": "西葫芦",
    "category": "蔬菜",
    "ndb": "11477",
    "portion": 150,
    "note": "带皮可食生重，烹饪油另记",
    "description": "SQUASH,SMMR,ZUCCHINI,INCL SKN,RAW",
    "kcal": 17
  },
  {
    "id": "sweet-potato",
    "name": "红薯（原料）",
    "category": "主食",
    "ndb": "11507",
    "portion": 150,
    "note": "生重，不直接套用到烤红薯熟重",
    "description": "SWEET POTATO,RAW,UNPREP",
    "kcal": 86
  },
  {
    "id": "raw-salmon",
    "name": "三文鱼（大西洋野生参考）",
    "category": "蛋白来源",
    "ndb": "15076",
    "portion": 150,
    "note": "可食生重，鱼种、养殖方式不同会变化，烹饪油另记",
    "description": "SALMON,ATLANTIC,WILD,RAW",
    "kcal": 142
  },
  {
    "id": "black-beans",
    "name": "熟黑豆",
    "category": "蛋白来源",
    "ndb": "16015",
    "portion": 100,
    "note": "成熟豆煮熟沥水，不加盐，不是生豆重量",
    "description": "BEANS,BLACK,MATURE SEEDS,CKD,BLD,WO/SALT",
    "kcal": 132
  },
  {
    "id": "almond",
    "name": "杏仁",
    "category": "坚果零食",
    "ndb": "12061",
    "portion": 20,
    "note": "可食原重，不含糖衣、额外油",
    "description": "ALMONDS",
    "kcal": 579
  },
  {
    "id": "walnut",
    "name": "核桃仁",
    "category": "坚果零食",
    "ndb": "12155",
    "portion": 20,
    "note": "去壳可食原重，不含额外糖油",
    "description": "WALNUTS,ENGLISH",
    "kcal": 654
  },
  {
    "id": "sunflower",
    "name": "葵花籽仁",
    "category": "坚果零食",
    "ndb": "12036",
    "portion": 20,
    "note": "干籽仁，不含壳和额外糖油",
    "description": "SUNFLOWER SD KRNLS,DRIED",
    "kcal": 584
  },
  {
    "id": "popcorn",
    "name": "空气爆米花（无额外糖油）",
    "category": "坚果零食",
    "ndb": "19034",
    "portion": 25,
    "note": "成品克重，不等同影院奶油爆米花",
    "description": "POPCORN,AIR-POPPED",
    "kcal": 387
  },
  {
    "id": "milk-chocolate",
    "name": "牛奶巧克力（通用参考）",
    "category": "坚果零食",
    "ndb": "19120",
    "portion": 20,
    "note": "按实际成品克重，品牌包装标签优先",
    "description": "CANDIES,MILK CHOC",
    "kcal": 535
  },
  {
    "id": "white-chocolate",
    "name": "白巧克力（通用参考）",
    "category": "坚果零食",
    "ndb": "19087",
    "portion": 20,
    "note": "按实际成品克重，品牌包装标签优先",
    "description": "CANDIES,WHITE CHOC",
    "kcal": 539
  },
  {
    "id": "chocolate-icecream",
    "name": "巧克力冰淇淋（通用参考）",
    "category": "奶蛋豆",
    "ndb": "19270",
    "portion": 70,
    "note": "按成品克重，配方差异较大，包装标签优先",
    "description": "ICE CREAMS,CHOC",
    "kcal": 216
  },
  {
    "id": "cheddar",
    "name": "切达奶酪",
    "category": "奶蛋豆",
    "ndb": "01009",
    "portion": 20,
    "note": "按可食克重，包装标签优先",
    "description": "CHEESE,CHEDDAR",
    "kcal": 404
  },
  {
    "id": "lowfat-milk",
    "name": "低脂牛奶（1%乳脂，按克）",
    "category": "饮料",
    "ndb": "01082",
    "portion": 250,
    "note": "按g记录，不把ml直接当g，包装标签优先",
    "description": "MILK,LOWFAT,FLUID,1% MILKFAT,W/ ADDED VIT A & VITAMIN D",
    "kcal": 42
  }
];
for(const r of everydayFoodReferences){const f=foodEntry(r.id,r.name,r.category,'g',100,r.kcal,r.portion,'sr28',r.note+'；USDA SR28 NDB '+r.ndb);f.reference={ndb:r.ndb,description:r.description,kcalPer100g:r.kcal};foodCatalog.push(f)}

foodRecipe('home-spinach-egg','菠菜炒蛋（配方估算）','家常',[['spinach',150],['egg',2],['oil',8]],'菠菜生重150g＋熟蛋参考2个＋油8g；不含主食');
foodRecipe('home-broccoli-beef','西兰花牛肉（配方估算）','家常',[['broccoli',150],['cooked-beef',100],['oil',8],['soy-sauce',10]],'西兰花生重150g＋熟牛肉参考100g＋油8g＋酱油10g；不含饭');
foodRecipe('home-carrot-pork','胡萝卜炒肉（配方估算）','家常',[['carrot',150],['cooked-pork',80],['oil',8],['soy-sauce',10]],'胡萝卜生重150g＋熟猪肉参考80g＋油8g＋酱油10g；不含饭');
foodRecipe('home-bok-choy','清炒小白菜（配方估算）','家常',[['bok-choy',200],['oil',8],['soy-sauce',5]],'小白菜生重200g＋油8g＋酱油5g；不含饭');
foodRecipe('home-tofu-soup','番茄豆腐汤（配方估算）','家常',[['tomato',150],['tofu',150],['water',300],['oil',3]],'番茄生重150g＋豆腐原重150g＋水300ml＋油3g；参考全部食用');
foodRecipe('home-zucchini-egg','西葫芦炒蛋（配方估算）','家常',[['zucchini',200],['egg',2],['oil',8]],'西葫芦生重200g＋熟蛋参考2个＋油8g；不含饭');
foodRecipe('home-salmon-rice','三文鱼蔬菜饭（配方估算）','家常',[['raw-salmon',150],['rice',150],['broccoli',100],['oil',5]],'野生大西洋三文鱼生重150g＋熟米饭150g＋西兰花生重100g＋油5g；饭已含');
foodRecipe('breakfast-egg-toast','鸡蛋奶酪吐司（配方估算）','早餐',[['white-bread',60],['egg',1],['cheddar',20]],'白吐司60g＋熟蛋1个＋切达奶酪20g；不含额外黄油和酱料');
foodRecipe('breakfast-yogurt-fruit','草莓燕麦酸奶碗（配方估算）','早餐',[['plain-yogurt',150],['strawberry',100],['oats-dry',30]],'原味酸奶150g＋草莓可食生重100g＋干燕麦30g；不含额外糖');
foodRecipe('breakfast-banana-toast','香蕉花生酱吐司（配方估算）','早餐',[['white-bread',60],['banana',100],['peanut-butter',15]],'白吐司60g＋香蕉去皮生重100g＋花生酱15g');
foodRecipe('snack-fruit-yogurt','蓝莓核桃酸奶（配方估算）','加餐',[['plain-yogurt',150],['blueberry',80],['walnut',15]],'原味酸奶150g＋蓝莓可食生重80g＋核桃仁15g');
foodRecipe('night-noodle-soup','鸡蛋青菜米粉（配方估算）','家常',[['rice-noodles',150],['bok-choy',100],['egg',1],['water',300],['oil',3]],'熟米粉150g＋小白菜生重100g＋熟蛋1个＋水300ml＋油3g；参考汤汁全部食用');

// Browse tags describe common ways to find foods, not actual storage or dietary advice.
const gangrongCake=foodEntry('gangrong-light-sugar-cake','港荣淡糖蒸蛋糕','早餐','g',100,1335/4.184,100,'gangrongLabel','包装每100g为1335kJ（约319kcal）；单个重量未提供，请填写实际食用克数。',['蛋糕','蒸蛋糕','淡糖蛋糕','港荣','早餐蛋糕']);
gangrongCake.checkedAt='2026-10-20';
gangrongCake.browseTags=['breakfast','staple','snacks','home','cupboard','night'];
gangrongCake.label={basisGrams:100,energyKj:1335,proteinGrams:6.5,fatGrams:10.2,saturatedFatGrams:3.4,transFatGrams:0,carbohydrateGrams:49.8,sugarGrams:13.7,sodiumMg:313};
foodCatalog.push(gangrongCake);
const foodBrowseGroups={
  place:{label:'地点',items:[['restaurant','餐馆','🍽️'],['home','家里','🏠'],['fridge','冰箱','🧊'],['cupboard','零食柜','🍪']]},
  kind:{label:'食材',items:[['fruit','水果','🍎'],['meat','肉类海鲜','🥩'],['vegetable','蔬菜','🥬'],['staple','主食','🍚'],['dairy','奶蛋豆','🥚'],['snacks','零食坚果','🥜'],['drink','饮料','🥤'],['custom','我的食品','📝']]},
  time:{label:'餐次',items:[['breakfast','早餐','🌅'],['lunch','午餐','☀️'],['dinner','晚餐','🌇'],['night','宵夜加餐','🌙']]}
};
const restaurantCategories=['麦当劳','肯德基','老乡鸡','大米先生','米村拌饭','杨国福','麻辣香锅','沙拉','披萨'];
const meatFoodIds=['chicken','cooked-beef','raw-pork-belly','cooked-pork','cooked-chicken-thigh','tuna','raw-salmon','lxj-chicken-soup','lxj-winter-soup','lxj-scallion-chicken','lxj-edamame-chicken','lxj-broccoli-chicken','mc-bigmac','mc-chicken','mc-grilled','kfc-spicy','kfc-grilled','mc-nuggets','kfc-nuggets'];
const dairyFoodIds=['egg','tofu','edamame','black-beans','full-milk','lowfat-milk','plain-yogurt','mozzarella','cheddar','chocolate-icecream'];
function foodBrowseTags(food){
  if(food.browseTags)return food.browseTags;
  const tags=new Set(),category=food.category;
  if(category==='水果')tags.add('fruit');
  if(category==='蔬菜')tags.add('vegetable');
  if(category==='主食'||['意面','披萨'].includes(category))tags.add('staple');
  if(meatFoodIds.includes(food.id))tags.add('meat');
  if(dairyFoodIds.includes(food.id)||category==='奶蛋豆')tags.add('dairy');
  if(category==='坚果零食')tags.add('snacks');
  if(category==='饮料')tags.add('drink');
  // Ingredients make mixed dishes discoverable under their actual food types.
  for(const c of food.recipe?.components||[]){const ingredient=foodCatalog.find(f=>f.id===c.foodId);if(ingredient)for(const tag of foodBrowseTags(ingredient))if(['meat','vegetable','staple','dairy','fruit'].includes(tag))tags.add(tag)}
  if(food.id==='tomato-egg'){tags.add('vegetable');tags.add('dairy')}
  if(['lxj-broccoli-chicken','lxj-winter-soup'].includes(food.id))tags.add('vegetable');
  if(food.id==='lxj-edamame-chicken')tags.add('dairy');
  if(restaurantCategories.includes(category))tags.add('restaurant');
  if(!restaurantCategories.includes(category)||['沙拉','意面'].includes(category))tags.add('home');
  if(!food.recipe&&(['水果','蔬菜','奶蛋豆','蛋白来源'].includes(category)||dairyFoodIds.includes(food.id)))tags.add('fridge');
  if(category==='坚果零食'||food.id==='peanut-butter')tags.add('cupboard');
  if(tags.has('fruit')&&!food.recipe||dairyFoodIds.includes(food.id)||['white-bread','oats-dry'].includes(food.id)||category==='早餐')tags.add('breakfast');
  if(food.recipe&&category!=='加餐'||['主食','蛋白来源','蔬菜','沙拉','披萨',...restaurantCategories].includes(category)){tags.add('lunch');tags.add('dinner')}
  if(['水果','坚果零食','加餐'].includes(category)||dairyFoodIds.includes(food.id)||food.id==='night-noodle-soup')tags.add('night');
  return [...tags];
}

// Local AI illustration atlases; thumbnails never determine energy or portion.
function foodSampleIndex(food){
  const name=String(food?.name||''),id=food?.id||food?.foodId||'';
  const dishes=[[/蛋挞/,0],[/薯条/,1],[/红酒醋/,2],[/辣椒炒肉/,3],[/包菜/,4],[/麻辣拌/,5],[/油醋汁/,6],[/茄子/,7],[/葵花籽/,8],[/爆米花/,9],[/小白菜/,10],[/西葫芦炒蛋/,11]];
  for(const [pattern,index]of dishes)if(pattern.test(name))return 72+index;
  const more=[[/毛豆/,0],[/黑豆/,1],[/蓝莓/,2],[/猕猴桃|奇异果/,3],[/菠萝|凤梨/,4],[/芒果/,5],[/梨/,6],[/桃子|水蜜桃/,7],[/橘|柑/,8],[/圣女果|樱桃番茄/,9],[/菠菜/,10],[/生菜/,11],[/黄瓜/,12],[/胡萝卜/,13],[/土豆|马铃薯/,14],[/红薯|地瓜/,15],[/玉米/,16],[/蘑菇|香菇|菌菇/,17],[/牛油果/,18],[/花生酱/,19],[/食用油|橄榄油|菜籽油/,20],[/白糖|砂糖|蜂蜜/,21],[/食盐/,22],[/酱油/,23],[/酸奶碗|燕麦酸奶/,24],[/鸡蛋奶酪吐司/,25],[/番茄炒蛋/,26],[/面汤|汤面|面条汤/,27],[/红烧鸡|葱油鸡|老乡鸡.*鸡|炖鸡/,28],[/红烧肉|五花|回锅肉/,29],[/小炒牛肉|辣椒炒牛肉/,30],[/炒蔬菜|炒青菜/,31],[/冰淇淋/,32],[/柠檬茶|茶饮/,33],[/豆浆/,34],[/炒饭/,35]];
  for(const [pattern,index]of more)if(pattern.test(name))return 36+index;
  const rules=[[/蛋糕|蒸糕/,23],[/汉堡|巨无霸|麦香|板烧/,24],[/披萨/,25],[/炸鸡|鸡块|鸡翅|劲脆|吮指/,26],[/饺|馄饨/,27],[/火锅|麻辣烫|香锅/,29],[/汤|羹/,28],[/咖啡/,33],[/可乐/,30],[/果汁|雪碧|奶茶|茶饮/,31],[/饮用水|纯净水|白水/,32],[/酸奶|冰淇淋/,19],[/牛奶|豆浆|奶饮/,18],[/奶酪|芝士|切达/,20],[/燕麦/,22],[/吐司|面包|馒头|包子/,21],[/巧克力/,35],[/花生|坚果|核桃|杏仁/,34],[/香蕉/,12],[/苹果/,13],[/橙|柑|橘/,14],[/西瓜/,15],[/草莓/,16],[/葡萄|蓝莓/,17],[/西兰花/,9],[/番茄|西红柿/,10],[/沙拉|生菜|菠菜|蔬菜|黄瓜|胡萝卜/,11],[/豆腐|豆干|毛豆|豆类/,7],[/虾/,8],[/鱼|三文|金枪/,6],[/鸡蛋|水煮蛋|煎蛋/,2],[/牛肉|牛排/,4],[/猪肉|五花|红烧肉|培根|排骨/,5],[/鸡|鸭|鹅/,3],[/意面|面条|粉|面食/,1],[/米饭|糙米|杂粮|米粥|拌饭|盖饭/,0]];
  for(const [pattern,index]of rules)if(pattern.test(name))return index;
  if(id==='water')return 32;
  if(food?.category==='水果')return 13;
  if(food?.category==='蔬菜')return 11;
  if(food?.category==='主食')return 0;
  return null;
}
