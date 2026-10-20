const fs = require('node:fs');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const apk = fs.readFileSync(process.argv[2]);
let end = apk.length - 22;
while (end >= Math.max(0, apk.length - 65557) && apk.readUInt32LE(end) !== 0x06054b50) end--;
assert(end >= 0 && apk.readUInt32LE(end) === 0x06054b50, 'ZIP directory missing');
const count = apk.readUInt16LE(end + 10);
let offset = apk.readUInt32LE(end + 16);
const entries = new Map();
for (let i = 0; i < count; i++) {
  assert.equal(apk.readUInt32LE(offset), 0x02014b50);
  const method = apk.readUInt16LE(offset + 10);
  const compressedSize = apk.readUInt32LE(offset + 20);
  const size = apk.readUInt32LE(offset + 24);
  const nameLength = apk.readUInt16LE(offset + 28);
  const extraLength = apk.readUInt16LE(offset + 30);
  const commentLength = apk.readUInt16LE(offset + 32);
  const name = apk.toString('utf8', offset + 46, offset + 46 + nameLength);
  assert(!name.includes('\\'), 'Backslash in Android asset path');
  assert(!entries.has(name), 'Duplicate ZIP entry');
  const local = apk.readUInt32LE(offset + 42);
  assert.equal(apk.readUInt32LE(local), 0x04034b50);
  const dataOffset = local + 30 + apk.readUInt16LE(local + 26) + apk.readUInt16LE(local + 28);
  const raw = apk.subarray(dataOffset, dataOffset + compressedSize);
  const data = method === 0 ? raw : method === 8 ? zlib.inflateRawSync(raw) : null;
  assert(data && data.length === size, `Invalid data for ${name}`);
  entries.set(name, {method, dataOffset, data});
  offset += 46 + nameLength + extraLength + commentLength;
}
for (const name of ['AndroidManifest.xml', 'resources.arsc', 'res/drawable-nodpi-v4/ic_training_journal.png', 'classes.dex', 'assets/www/index.html', 'assets/www/app.js', 'assets/www/styles.css', 'assets/www/home.css', 'assets/www/nutrition.css', 'assets/www/foods.js', 'assets/www/nutrition.js']) {
  assert(entries.has(name) && entries.get(name).data.length > 0, `Missing ${name}`);
}
const table = entries.get('resources.arsc');
for(const name of ['food-samples.png','food-samples-more.png','food-samples-dishes.png']){
  const image=entries.get('assets/www/images/'+name);
  assert(image&&image.data.length>8,'Missing offline food sample '+name);
  assert.equal(image.data.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Invalid food sample PNG');
  assert(entries.get('assets/www/nutrition.css').data.toString('utf8').includes('images/'+name),'Food image reference missing');
}
assert.equal(table.method, 0, 'Android requires resources.arsc to be stored uncompressed');
assert.equal(table.dataOffset % 4, 0, 'Android requires resources.arsc aligned to four bytes');
const dex = entries.get('classes.dex').data;
assert.equal(dex.toString('ascii', 0, 4), 'dex\n', 'Invalid Android code');
const html = entries.get('assets/www/index.html').data.toString('utf8');
for (const name of ['app.js', 'styles.css', 'home.css', 'nutrition.css', 'foods.js', 'nutrition.js']) assert(html.includes(name), `Missing HTML reference: ${name}`);
console.log(JSON.stringify({verified: true, entries: entries.size, resourceTable: {compression: 'stored', offset: table.dataOffset, aligned: true}, bytes: apk.length}));
