const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../nextstep-web/dist');
const target = path.resolve(process.argv[2], 'www');
fs.mkdirSync(target, { recursive: true });
for (const name of ['index.html', 'styles.css', 'home.css', 'app.js']) {
  let content = fs.readFileSync(path.join(source, name), 'utf8');
  if (name === 'styles.css') content = content.replace(/@import url\([^;]+;/g, '');
  if (name === 'app.js') {
    const marker = "case 'export':{const url=";
    if (!content.includes(marker)) throw new Error('Export action changed; update the Android adapter.');
    content = content.replace(marker, "case 'export':{if(window.NextStepAndroid&&typeof window.NextStepAndroid.exportRecords==='function'){window.NextStepAndroid.exportRecords(JSON.stringify(exportData(),null,2));break;}const url=");
  }
  fs.writeFileSync(path.join(target, name), content);
}
console.log('Shared web assets bundled for offline Android use.');
