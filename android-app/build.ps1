param(
    [string]$JdkPath = 'C:/Users/tyran/.jdks/openjdk-26.0.2.1',
    [string]$BuildToolsPath = "$PSScriptRoot/tools/build-tools/android-15",
    [string]$PlatformPath = "$PSScriptRoot/tools/platform/android-35",
    [string]$UpdateBaseUrl = ''
)
$ErrorActionPreference = 'Stop'
$buildPath = Join-Path $PSScriptRoot ('build/' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$outputPath = Join-Path $PSScriptRoot 'dist'
$signingPath = Join-Path $PSScriptRoot 'signing'
$androidJar = Join-Path $PlatformPath 'android.jar'
$java = Join-Path $JdkPath 'bin/java.exe'
$javac = Join-Path $JdkPath 'bin/javac.exe'
$jar = Join-Path $JdkPath 'bin/jar.exe'
$keytool = Join-Path $JdkPath 'bin/keytool.exe'
$aapt = Join-Path $BuildToolsPath 'aapt2.exe'
$align = Join-Path $BuildToolsPath 'zipalign.exe'
$signerJar = Join-Path $BuildToolsPath 'lib/apksigner.jar'
$dexJar = Join-Path $BuildToolsPath 'lib/d8.jar'
foreach ($file in @($androidJar, $java, $javac, $jar, $keytool, $aapt, $align, $signerJar, $dexJar)) {
    if (-not (Test-Path -LiteralPath $file)) { throw "Missing build dependency: $file" }
}
function Invoke-Checked([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Build command failed: $Executable (exit $LASTEXITCODE)" }
}
New-Item -ItemType Directory -Force $buildPath, "$buildPath/classes", "$buildPath/dex", "$buildPath/assets", $outputPath, $signingPath | Out-Null
Invoke-Checked 'node' @("$PSScriptRoot/prepare-assets.cjs", "$buildPath/assets")
Invoke-Checked 'node' @('--check', "$buildPath/assets/www/app.js")
Invoke-Checked $aapt @('compile', '--dir', "$PSScriptRoot/src/res", '-o', "$buildPath/resources.zip")
Invoke-Checked $aapt @('link', '-I', $androidJar, '--manifest', "$PSScriptRoot/src/AndroidManifest.xml", '-o', "$buildPath/unsigned.apk", '-A', "$buildPath/assets", "$buildPath/resources.zip")
$javaSources = @(Get-ChildItem "$PSScriptRoot/src/java" -Recurse -Filter '*.java' | Select-Object -ExpandProperty FullName)
Invoke-Checked $javac (@('--release', '8', '-encoding', 'UTF-8', '-classpath', $androidJar, '-d', "$buildPath/classes") + $javaSources)
Invoke-Checked $jar @('cf', "$buildPath/classes.jar", '-C', "$buildPath/classes", '.')
Invoke-Checked $java @('-cp', $dexJar, 'com.android.tools.r8.D8', '--min-api', '26', '--lib', $androidJar, '--output', "$buildPath/dex", "$buildPath/classes.jar")
Invoke-Checked $jar @('uf', "$buildPath/unsigned.apk", '-C', "$buildPath/dex", 'classes.dex')
# Windows AAPT2 can emit backslashes in asset entries. Android AssetManager
# requires forward slashes regardless of the build host's path convention.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$sourceZip = [System.IO.Compression.ZipFile]::OpenRead("$buildPath/unsigned.apk")
$normalizedZip = [System.IO.Compression.ZipFile]::Open("$buildPath/normalized.apk", [System.IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($entry in $sourceZip.Entries) {
        $name = $entry.FullName.Replace('\', '/')
        # Android 11+ rejects compressed resource tables for targetSdk >= 30.
        $compression = if ($name -eq 'resources.arsc') { [System.IO.Compression.CompressionLevel]::NoCompression } else { [System.IO.Compression.CompressionLevel]::Optimal }
        $newEntry = $normalizedZip.CreateEntry($name, $compression)
        $inputStream = $entry.Open()
        $outputStream = $newEntry.Open()
        try { $inputStream.CopyTo($outputStream) }
        finally { $inputStream.Dispose(); $outputStream.Dispose() }
    }
} finally { $sourceZip.Dispose(); $normalizedZip.Dispose() }
$checkedZip = [System.IO.Compression.ZipFile]::OpenRead("$buildPath/normalized.apk")
try {
    foreach ($name in @('assets/www/index.html', 'assets/www/app.js', 'assets/www/home.css', 'assets/www/styles.css', 'classes.dex')) {
        if ($null -eq $checkedZip.GetEntry($name)) { throw "Missing APK entry: $name" }
    }
    if (@($checkedZip.Entries | Where-Object { $_.FullName.Contains('\') }).Count -ne 0) { throw 'Invalid Android asset path' }
} finally { $checkedZip.Dispose() }
Invoke-Checked $align @('-f', '4', "$buildPath/normalized.apk", "$buildPath/aligned.apk")
$keyPath = Join-Path $signingPath 'nextstep-demo.keystore'
if (-not (Test-Path -LiteralPath $keyPath)) {
    Invoke-Checked $keytool @('-genkeypair', '-keystore', $keyPath, '-storepass', 'android', '-keypass', 'android', '-alias', 'nextstep-demo', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000', '-dname', 'CN=NextStep Demo, O=Personal Development, C=CN', '-storetype', 'JKS')
}
$apk = Join-Path $outputPath 'NextStep-0.6.7.apk'
Invoke-Checked $java @('-jar', $signerJar, 'sign', '--ks', $keyPath, '--ks-key-alias', 'nextstep-demo', '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', $apk, "$buildPath/aligned.apk")
Invoke-Checked $java @('-jar', $signerJar, 'verify', '--verbose', '--print-certs', $apk)
Invoke-Checked $align @('-c', '4', $apk)
Invoke-Checked 'node' @("$PSScriptRoot/verify-apk.cjs", $apk)
Invoke-Checked $aapt @('dump', 'badging', $apk)
$hash = (Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
Set-Content -LiteralPath "$apk.sha256" -Value "$hash  NextStep-0.6.7.apk" -Encoding utf8
Write-Output "APK: $apk"
Write-Output "SHA256: $hash"
if ($UpdateBaseUrl) { Invoke-Checked 'node' @("$PSScriptRoot/update-manifest.cjs", '--base-url', $UpdateBaseUrl) }
