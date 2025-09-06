# Ahmet's Special SEO Tool - CasaOS Test Script
param(
    [string]$ContainerName = "ahmets-seo-tool-casaos",
    [string]$Port = "9001",
    [string]$Domain = "seotool.ahmetkahraman.tech"
)

Write-Host "🧪 Ahmet's Special SEO Tool - CasaOS Test" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }

$TestsPassed = 0
$TestsTotal = 5

# Test 1: Container Status
Write-Info "Testing CasaOS container status..."
try {
    $Container = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
    if ($Container) {
        $Status = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        if (-not $Status) { $Status = "no-health-check" }
        Write-Success "✅ Container running (Health: $Status)"
        $TestsPassed++
    } else {
        Write-Error "❌ Container not running"
    }
} catch {
    Write-Error "❌ Container test failed"
}

# Test 2: Port Access
Write-Info "Testing port 9001 access..."
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 10
    if ($Response.StatusCode -eq 200) {
        Write-Success "✅ Port 9001 access OK"
        $TestsPassed++
    } else {
        Write-Error "❌ Port 9001 access failed"
    }
} catch {
    Write-Error "❌ Port 9001 access failed: $($_.Exception.Message)"
}

# Test 3: CasaOS Labels
Write-Info "Testing CasaOS labels..."
try {
    $Labels = docker inspect $ContainerName --format='{{json .Config.Labels}}' | ConvertFrom-Json
    if ($Labels.'casaos.enable' -eq "true") {
        Write-Success "✅ CasaOS labels configured"
        Write-Info "   Port: $($Labels.'casaos.port')"
        Write-Info "   Title: $($Labels.'casaos.title')"
        $TestsPassed++
    } else {
        Write-Error "❌ CasaOS labels missing"
    }
} catch {
    Write-Error "❌ Label check failed"
}

# Test 4: Health Check
Write-Info "Testing health check..."
try {
    $Health = docker inspect $ContainerName --format='{{.State.Health.Status}}'
    if ($Health -eq "healthy") {
        Write-Success "✅ Health check passing"
        $TestsPassed++
    } else {
        Write-Error "❌ Health check failing: $Health"
    }
} catch {
    Write-Error "❌ Health check test failed"
}

# Test 5: WebP Favicon
Write-Info "Testing WebP favicon..."
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:$Port/favicon.webp" -UseBasicParsing -TimeoutSec 5
    if ($Response.StatusCode -eq 200) {
        Write-Success "✅ WebP favicon accessible"
        $TestsPassed++
    } else {
        Write-Error "❌ WebP favicon failed"
    }
} catch {
    Write-Error "❌ WebP favicon test failed"
}

# Results
Write-Host ""
Write-Host "📊 CasaOS Test Results: $TestsPassed/$TestsTotal passed" -ForegroundColor Cyan

if ($TestsPassed -eq $TestsTotal) {
    Write-Success "🎉 CasaOS ready! All tests passed."
} elseif ($TestsPassed -ge 3) {
    Write-Success "✅ CasaOS mostly ready with minor issues."
} else {
    Write-Error "❌ CasaOS has issues that need attention."
}

Write-Host ""
Write-Host "🔗 CasaOS Access:" -ForegroundColor Cyan
Write-Host "   Local: http://localhost:$Port"
Write-Host "   Docker Hub: axxmet/ahmets-special-seo-tool:casaos"
Write-Host "   Image: axxmet/ahmets-special-seo-tool:v1.3-casaos"
