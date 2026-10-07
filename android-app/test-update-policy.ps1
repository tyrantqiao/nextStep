param([string]$JdkPath = 'C:/Users/tyran/.jdks/openjdk-26.0.2.1')
$ErrorActionPreference = 'Stop'
$testOutput = Join-Path $PSScriptRoot ('build/update-policy-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Force $testOutput | Out-Null
& (Join-Path $JdkPath 'bin/javac.exe') '-encoding' 'UTF-8' '-d' $testOutput "$PSScriptRoot/src/java/com/nextstep/training/UpdatePolicy.java" "$PSScriptRoot/tests/UpdatePolicyTest.java"
if ($LASTEXITCODE -ne 0) { throw 'Update policy test compilation failed' }
& (Join-Path $JdkPath 'bin/java.exe') '-cp' $testOutput 'com.nextstep.training.UpdatePolicyTest' $testOutput
if ($LASTEXITCODE -ne 0) { throw 'Update policy tests failed' }
