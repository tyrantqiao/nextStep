const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const apk=path.resolve('android-app/dist/NextStep-0.8.2.apk'),buf=fs.readFileSync(apk);let end=buf.length-22;while(end>=0&&buf.readUInt32LE(end)!==0x06054b50)end--;assert.ok(end>=0);let offset=buf.readUInt32LE(end+16),count=buf.readUInt16LE(end+10),checked=[];
for(let i=0;i<count;i++){
  const length=buf.readUInt16LE(offset+28),name=buf.toString('utf8',offset+46,offset+46+length),local=buf.readUInt32LE(offset+42),method=buf.readUInt16LE(offset+10),size=buf.readUInt32LE(offset+20),begin=local+30+buf.readUInt16LE(local+26)+buf.readUInt16LE(local+28);
  if(name.startsWith('assets/www/')){
    const filename=name.slice(11),data=method===8?zlib.inflateRawSync(buf.subarray(begin,begin+size)):buf.subarray(begin,begin+size);let source=fs.readFileSync(path.join('nextstep-web/dist',filename),'utf8');
    if(filename==='styles.css')source=source.replace(/@import\s+url\([^)]*\)\s*;/g,'');
    if(filename==='app.js')source=source.replace("case 'export':{const url=","case 'export':{if(window.NextStepAndroid&&typeof window.NextStepAndroid.exportRecords==='function'){window.NextStepAndroid.exportRecords(JSON.stringify(exportData(),null,2));break;}const url=");
    assert.equal(data.toString('utf8'),source,name);checked.push(filename);
  }
  offset+=46+length+buf.readUInt16LE(offset+30)+buf.readUInt16LE(offset+32);
}
assert.equal(checked.length,7);const result={verified:true,apk:path.basename(apk),sha256:crypto.createHash('sha256').update(buf).digest('hex'),checked};fs.writeFileSync(path.join(__dirname,'apk-assets-check.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
