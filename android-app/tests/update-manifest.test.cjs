const test = require('node:test');
const assert = require('node:assert/strict');
const {createManifest, https} = require('../update-manifest.cjs');
const manifest = '<manifest package="com.nextstep.training" android:versionCode="14" android:versionName="0.6.0"><uses-sdk android:minSdkVersion="26"/></manifest>';
test('update manifest uses actual APK bytes and Android release version', () => {
  const info = createManifest({manifest, apk: Buffer.from('signed-test-apk'), apkUrl: 'https://updates.example/NextStep-0.6.0.apk', notes: '应用内更新'});
  assert.equal(info.versionCode, 14); assert.equal(info.versionName, '0.6.0'); assert.equal(info.size, 15);
  assert.equal(info.packageName, 'com.nextstep.training'); assert.equal(info.minSdk, 26);
  assert.equal(info.sha256, require('node:crypto').createHash('sha256').update('signed-test-apk').digest('hex'));
  assert.equal(info.notes, '应用内更新');
});
test('update manifest rejects wrong packages, invalid versions and oversized metadata', () => {
  for (const xml of [manifest.replace('com.nextstep.training', 'com.other'), manifest.replace('"14"', '"1.5"'), manifest.replace('"26"', '"25"')])
    assert.throws(() => createManifest({manifest: xml, apk: Buffer.from('apk'), apkUrl: 'https://example.com/app.apk'}));
  assert.throws(() => createManifest({manifest, apk: Buffer.alloc(0), apkUrl: 'https://example.com/app.apk'}));
  assert.throws(() => createManifest({manifest, apk: Buffer.from('apk'), apkUrl: 'https://example.com/app.apk', notes: 'x'.repeat(4001)}));
});
test('update URLs reject insecure protocols and embedded credentials', () => {
  for (const url of ['http://example.com/app.apk', 'file:///app.apk', 'https://user:password@example.com/app.apk', 'https://example.com/app.apk#fragment']) assert.throws(() => https(url));
  assert.equal(https('https://example.com/app.apk?download=1').protocol, 'https:');
});
