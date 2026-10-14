/* Offline references. Recipe portions are editable, never personal measurements. */
const foodDataVersion='2026-10-15.1';
const foodSources={
  grains:{type:'食物成分参考',name:'USDA Standard Reference 28 · 谷物与意面',url:'https://www.ars.usda.gov/ARSUserFiles/80400535/Data/SR/SR28/reports/sr28fg20.pdf',license:'USDA 公共领域数据；仅选用基础食物参考值'},
  eggs:{type:'食物成分参考',name:'USDA SR28 · 鸡蛋 NDB 01129',url:'https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR/SR28/reports/sr28fg01.pdf',license:'USDA 公共领域数据'},
  chicken:{type:'食物成分参考',name:'USDA · 烤去皮鸡胸肉 NDB 05064',url:'https://www.ars.usda.gov/ARSUserFiles/80400525/articles/ift2006_chicken.pdf',license:'USDA 基础成分参考'},
  recipe:{type:'配方估算',name:'NextStep 参考配方',url:null,license:'独立参考配方；实际含水量、油和食材会改变热量'},
  cola:{type:'包装标签参考',name:'可口可乐 · 330ml · 6928804014570 · 180kJ/100ml',url:'https://nlc.chinanutri.cn/food/Ok7S31KVS2Kh7WcIuS2Ykw.html',license:'单个标签事实参考，实际包装为准；未复制完整数据库'},
  sprite:{type:'包装标签参考',name:'雪碧 · 600ml · 6954767434674 · 191kJ/100ml',url:'https://nlc.chinanutri.cn/food/402881eb55a45f0f0155a4876b5a6df4.html',license:'单个标签事实参考，实际包装为准；未复制完整数据库'},
  pending:{type:'待填写热量',name:'尚未核实当前大陆规格的热量',url:null,license:'请按包装或点餐页填写；未知热量不计作零'},
  manual:{type:'用户手填',name:'用户输入的热量或标签',url:null,license:'按用户填写保存，不代表实测'}
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
