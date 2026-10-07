const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function https(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new Error('Update URL must use HTTPS without credentials or fragments.');
  return url;
}
function createManifest({manifest, apk, apkUrl, notes = ''}) {
  https(apkUrl);
  const attribute = name => {
    const match = manifest.match(new RegExp('(?:android:)?' + name + '="([^"<>]+)"'));
    if (!match) throw new Error('Missing manifest attribute: ' + name);
    return match[1];
  };
  const versionCode = Number(attribute('versionCode')), minSdk = Number(attribute('minSdkVersion'));
  if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2147483647 || !Number.isInteger(minSdk) || minSdk < 26) throw new Error('Invalid release version or SDK.');
  if (!Buffer.isBuffer(apk) || apk.length < 1 || apk.length > 100 * 1024 * 1024) throw new Error('Invalid APK size.');
  if (attribute('package') !== 'com.nextstep.training') throw new Error('Package name mismatch.');
  if (typeof notes !== 'string' || notes.length > 4000) throw new Error('Release notes exceed 4000 characters.');
  return {packageName: attribute('package'), versionCode, versionName: attribute('versionName'), minSdk, size: apk.length,
    sha256: crypto.createHash('sha256').update(apk).digest('hex'), apkUrl, notes};
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2), options = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!['--base-url', '--notes-file'].includes(args[i]) || !args[i + 1]) throw new Error('Usage: node android-app/update-manifest.cjs --base-url https://host/updates/ [--notes-file file]');
      options[args[i]] = args[i + 1];
    }
    const base = https(options['--base-url']);
    if (base.search) throw new Error('Base URL cannot contain a query.');
    base.pathname = base.pathname.replace(/\/?$/, '/');
    const manifest = fs.readFileSync(path.join(__dirname, 'src/AndroidManifest.xml'), 'utf8');
    const version = manifest.match(/android:versionName="([0-9.]+)"/)[1];
    const name = `NextStep-${version}.apk`, file = path.join(__dirname, 'dist', name);
    // Require the builder's verification checksum to match the exact artifact.
    const apk = fs.readFileSync(file), checksum = fs.readFileSync(file + '.sha256', 'utf8').replace(/^\uFEFF/, '').trim().split(/\s+/)[0];
    const info = createManifest({manifest, apk, apkUrl: new URL(name, base).href,
      notes: options['--notes-file'] ? fs.readFileSync(options['--notes-file'], 'utf8') : ''});
    if (info.sha256 !== checksum) throw new Error('APK differs from its verified build checksum; rebuild first.');
    const output = path.join(__dirname, 'dist/update.json');
    fs.writeFileSync(output, JSON.stringify(info, null, 2) + '\n');
    console.log('Update manifest: ' + output);
    console.log('Publish APK at: ' + info.apkUrl);
    console.log('Publish update.json at: ' + new URL('update.json', base).href);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {createManifest, https};
