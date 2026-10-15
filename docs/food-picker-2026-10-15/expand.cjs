// Usage: node docs/food-picker-2026-10-15/expand.cjs <USDA SR28 ABBREV.txt>
const fs=require('node:fs');
const rows=new Map(fs.readFileSync(process.argv[2],'latin1').split(/\r?\n/).map(l=>{const a=l.split('^').map(v=>v.replaceAll('~',''));return [a[0],a]}));
const definitions=[
 ['orange','橙子','水果','09200',150,'去皮可食生重'],
 ['mandarin','橘子','水果','09218',100,'去皮可食生重'],
 ['pineapple','菠萝','水果','09266',150,'去皮可食生重'],
 ['strawberry','草莓','水果','09316',150,'去蒂可食生重'],
 ['blueberry','蓝莓','水果','09050',100,'可食生重'],
 ['grape','葡萄','水果','09132',100,'红或绿无籽葡萄，可食生重'],
 ['kiwi','猕猴桃','水果','09148',100,'绿心，去皮可食生重'],
 ['watermelon','西瓜','水果','09326',250,'去皮可食生重'],
 ['pear','梨','水果','09252',180,'可食生重，去核'],
 ['mango','芒果','水果','09176',150,'去皮去核可食生重'],
 ['peach','桃子','水果','09236',150,'黄桃参考，去核可食生重'],
 ['spinach','菠菜','蔬菜','11457',150,'可食生重，烹饪油另记'],
 ['carrot','胡萝卜','蔬菜','11124',100,'可食生重，烹饪油另记'],
 ['bok-choy','小白菜','蔬菜','11116',150,'可食生重，烹饪油另记'],
 ['zucchini','西葫芦','蔬菜','11477',150,'带皮可食生重，烹饪油另记'],
 ['sweet-potato','红薯（原料）','主食','11507',150,'生重，不直接套用到烤红薯熟重'],
 ['raw-salmon','三文鱼（大西洋野生参考）','蛋白来源','15076',150,'可食生重，鱼种、养殖方式不同会变化，烹饪油另记'],
 ['black-beans','熟黑豆','蛋白来源','16015',100,'成熟豆煮熟沥水，不加盐，不是生豆重量'],
 ['almond','杏仁','坚果零食','12061',20,'可食原重，不含糖衣、额外油'],
 ['walnut','核桃仁','坚果零食','12155',20,'去壳可食原重，不含额外糖油'],
 ['sunflower','葵花籽仁','坚果零食','12036',20,'干籽仁，不含壳和额外糖油'],
 ['popcorn','空气爆米花（无额外糖油）','坚果零食','19034',25,'成品克重，不等同影院奶油爆米花'],
 ['milk-chocolate','牛奶巧克力（通用参考）','坚果零食','19120',20,'按实际成品克重，品牌包装标签优先'],
 ['white-chocolate','白巧克力（通用参考）','坚果零食','19087',20,'按实际成品克重，品牌包装标签优先'],
 ['chocolate-icecream','巧克力冰淇淋（通用参考）','奶蛋豆','19270',70,'按成品克重，配方差异较大，包装标签优先'],
 ['cheddar','切达奶酪','奶蛋豆','01009',20,'按可食克重，包装标签优先'],
 ['lowfat-milk','低脂牛奶（1%乳脂，按克）','饮料','01082',250,'按g记录，不把ml直接当g，包装标签优先']
];
const references=definitions.map(([id,name,category,ndb,portion,note])=>{const a=rows.get(ndb);if(!a)throw Error(ndb);return {id,name,category,ndb,portion,note,description:a[1],kcal:Number(a[3])}});
fs.writeFileSync(__dirname+'/usda-references.json',JSON.stringify({sourceUrl:'https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/SR28/dnload/sr28abbr.zip',checkedAt:'2026-10-15',foods:references},null,2)+'\n');
const code='\n/* Everyday foods: verified USDA SR28 edible-portion references. */\nconst everydayFoodReferences='+JSON.stringify(references,null,2)+';\nfor(const r of everydayFoodReferences){const f=foodEntry(r.id,r.name,r.category,\'g\',100,r.kcal,r.portion,\'sr28\',r.note+\'；USDA SR28 NDB \'+r.ndb);f.reference={ndb:r.ndb,description:r.description,kcalPer100g:r.kcal};foodCatalog.push(f)}\n';
const file='nextstep-web/dist/foods.js';let source=fs.readFileSync(file,'utf8');if(source.includes('const everydayFoodReferences='))throw Error('Already expanded');fs.appendFileSync(file,code);
