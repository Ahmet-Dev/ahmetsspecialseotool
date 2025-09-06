# Ahmet's Special SEO Tool - Server Testing Script (Windows)
# Quick server deployment test

param(
    [string]$ContainerName = "ahmets-seo-tool-casaos",
    [string]$Port = "9001",
    [string]$Domain = "seotool.ahmetkahraman.tech"
)

$ErrorActionPreference = "Continue"

Write-Host "🧪 Ahmet's Special SEO Tool - Server Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Functions
function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param([string]$Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

$TestsPassed = 0
$TestsTotal = 7

# Test container status
Write-Info "Testing container status..."
try {
    $Container = docker ps --format "{{.Names}}" | Where-Object { $_ -eq $ContainerName }
    if ($Container) {
        $Status = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        if (-not $Status) { $Status = "no-health-check" }
        Write-Success "✅ Container running (Health: $Status)"
        
        $StartTime = docker inspect --format='{{.State.StartedAt}}' $ContainerName | ForEach-Object { $_.Split('T')[0] }
        $Image = docker inspect --format='{{.Config.Image}}' $ContainerName
        Write-Info "   Image: $Image"
        Write-Info "   Started: $StartTime"
        $TestsPassed++
    } else {
        Write-Error "❌ Container not running"
    }
} catch {
    Write-Error "❌ Container test failed: $($_.Exception.Message)"
}

# Test direct access
Write-Info "Testing direct access..."
try {
    $Response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 10
    if ($Response.StatusCode -eq 200) {
        Write-Success "✅ Direct access OK (HTTP $($Response.StatusCode))"
        
        # Test title
        if ($Response.Content -match '<title>([^<]+)</title>') {
            $Title = $Matches[1]
            if ($Title -like "*SEO Tool*") {
                Write-Success "✅ Page title correct: $Title"
            } else {
                Write-Warning "⚠️ Unexpected page title: $Title"
            }
        }
        $TestsPassed++
    } else {
        Write-Error "❌ Direct access failed: HTTP $($Response.StatusCode)"
    }
} catch {
    Write-Error "❌ Direct access failed: $($_.Exception.Message)"
}

# Test network access
Write-Info "Testing network access..."
try {
    $ServerIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" -or $_.IPAddress -like "172.*" } | Select-Object -First 1).IPAddress
    if ($ServerIP) {
        $Response = Invoke-WebRequest -Uri "http://${ServerIP}:${Port}" -UseBasicParsing -TimeoutSec 5
        if ($Response.StatusCode -eq 200) {
            Write-Success "✅ Network access OK: http://${ServerIP}:${Port}"
            $TestsPassed++
        } else {
            Write-Warning "⚠️ Network access failed (firewall?)"
        }
    } else {
        Write-Warning "⚠️ Could not determine server IP"
    }
} catch {
    Write-Warning "⚠️ Network access test failed: $($_.Exception.Message)"
}

# Test reverse proxy
Write-Info "Testing reverse proxy..."
try {
    # Test domain routing with Host header
    $Response = Invoke-WebRequest -Uri "http://localhost:8080" -Headers @{"Host" = $Domain} -UseBasicParsing -TimeoutSec 5
    if ($Response.StatusCode -eq 200) {
        Write-Success "✅ Domain routing OK: $Domain"
        $TestsPassed++
    } else {
        Write-Warning "⚠️ Domain routing failed"
    }
} catch {
    Write-Warning "⚠️ Reverse proxy test failed: $($_.Exception.Message)"
}

# Test HTTPS
Write-Info "Testing SSL/HTTPS..."
try {
    $Response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 10
    if ($Response.StatusCode -eq 200) {
        Write-Success "✅ HTTPS access OK"
        $TestsPassed++
    } else {
        Write-Warning "⚠️ HTTPS access failed"
    }
} catch {
    Write-Warning "⚠️ HTTPS test failed (normal if no SSL): $($_.Exception.Message)"
}

# Performance test
Write-Info "Testing performance..."
try {
    $TotalTime = 0
    $Requests = 5
    $SuccessCount = 0
    
    for ($i = 1; $i -le $Requests; $i++) {
        $StartTime = Get-Date
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 5
            if ($Response.StatusCode -eq 200) {
                $EndTime = Get-Date
                $Duration = ($EndTime - $StartTime).TotalSeconds
                $TotalTime += $Duration
                $SuccessCount++
            }
        } catch {
            # Silent failure for performance test
        }
    }
    
    if ($SuccessCount -gt 0) {
        $AvgTime = [math]::Round($TotalTime / $SuccessCount, 3)
        Write-Success "✅ Performance test ($SuccessCount/$Requests requests)"
        Write-Info "   Average response time: ${AvgTime}s"
        
        if ($AvgTime -lt 1.0) {
            Write-Success "✅ Response time excellent (<1s)"
        } elseif ($AvgTime -lt 3.0) {
            Write-Success "✅ Response time good (<3s)"
        } else {
            Write-Warning "⚠️ Response time slow (>3s)"
        }
        $TestsPassed++
    } else {
        Write-Error "❌ Performance test failed"
    }
} catch {
    Write-Error "❌ Performance test error: $($_.Exception.Message)"
}

# Test logs
Write-Info "Checking recent logs..."
try {
    $Logs = docker logs $ContainerName --since="1h" 2>&1
    $ErrorCount = ($Logs | Where-Object { $_ -match "error" -or $_ -match "ERROR" }).Count
    $WarningCount = ($Logs | Where-Object { $_ -match "warning" -or $_ -match "WARNING" }).Count
    
    if ($ErrorCount -eq 0) {
        Write-Success "✅ No errors in recent logs"
    } else {
        Write-Warning "⚠️ $ErrorCount errors in recent logs"
    }
    
    if ($WarningCount -eq 0) {
        Write-Success "✅ No warnings in recent logs"
    } else {
        Write-Info "ℹ️ $WarningCount warnings in recent logs"
    }
    $TestsPassed++
} catch {
    Write-Warning "⚠️ Log check failed: $($_.Exception.Message)"
}

# Test resources
Write-Info "Checking resource usage..."
try {
    $Stats = docker stats $ContainerName --no-stream --format "table {{.CPUPerc}}`t{{.MemUsage}}" | Select-Object -Skip 1
    if ($Stats) {
        $CPU = ($Stats -split "`t")[0]
        $Memory = ($Stats -split "`t")[1]
        Write-Success "✅ Resource usage: CPU $CPU, Memory $Memory"
    }
    
    # Disk space
    $Drive = Get-PSDrive C
    $FreeSpace = [math]::Round($Drive.Free / 1GB, 2)
    Write-Info "   Available disk space: ${FreeSpace}GB"
} catch {
    Write-Warning "⚠️ Resource check failed: $($_.Exception.Message)"
}

# Results
Write-Host ""
Write-Host "📊 Test Results: $TestsPassed/$TestsTotal passed" -ForegroundColor Cyan

if ($TestsPassed -eq $TestsTotal) {
    Write-Success "🎉 All tests passed! Server is running perfectly."
} elseif ($TestsPassed -ge 5) {
    Write-Success "✅ Server is running well with minor issues."
} elseif ($TestsPassed -ge 3) {
    Write-Warning "⚠️ Server is running but has some issues."
} else {
    Write-Error "❌ Server has major issues that need attention."
}

Write-Host ""
Write-Host "🔗 Access URLs:" -ForegroundColor Cyan
Write-Host "   Direct: http://localhost:$Port"
Write-Host "   Domain: https://$Domain (if configured)"
Write-Host ""
Write-Host "📋 Quick Commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker logs $ContainerName"
Write-Host "   Restart: docker restart $ContainerName"
Write-Host "   Update: .\deploy.ps1"
