# Güvenlik Test Script - CSS/JS Yükleme Kontrolü
# Ahmet's Special SEO Tool

Write-Host "GUVENLIK SEO Tool Guvenlik Testi Baslatiyor..." -ForegroundColor Green

# Test URL'si (local veya production)
$testUrl = "http://localhost:9001"
$prodUrl = "https://seo.ahmetkahraman.tech"

function Test-Headers {
    param($url)
    
    Write-Host "HEADERS Headers test ediliyor: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method HEAD -UseBasicParsing
        
        Write-Host "OK HTTP Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Güvenlik Headers Kontrolü
        $securityHeaders = @(
            "Content-Security-Policy",
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Referrer-Policy"
        )
        
        foreach ($header in $securityHeaders) {
            if ($response.Headers[$header]) {
                Write-Host "OK $header`: $($response.Headers[$header])" -ForegroundColor Green
            } else {
                Write-Host "MISSING $header`: EKSIK!" -ForegroundColor Red
            }
        }
        
    } catch {
        Write-Host "ERROR Baglanti hatasi: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Test-StaticAssets {
    param($url)
    
    Write-Host "📁 Static dosyalar test ediliyor..." -ForegroundColor Yellow
    
    $assets = @(
        "$url/assets/css/index.css",
        "$url/assets/js/index.js",
        "$url/favicon.ico",
        "$url/manifest.json"
    )
    
    foreach ($asset in $assets) {
        try {
            $response = Invoke-WebRequest -Uri $asset -Method HEAD -UseBasicParsing -ErrorAction SilentlyContinue
            
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $asset - Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
            } else {
                Write-Host "⚠️ $asset - Status: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "❌ $asset - Erişilemedi" -ForegroundColor Red
        }
    }
}

function Test-CSP {
    param($url)
    
    Write-Host "🛡️ CSP Policy test ediliyor..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing
        $csp = $response.Headers['Content-Security-Policy']
        
        if ($csp) {
            Write-Host "✅ CSP Aktif: $csp" -ForegroundColor Green
            
            # Tehlikeli direktifleri kontrol et
            if ($csp -match "'unsafe-eval'") {
                Write-Host "⚠️ UYARI: unsafe-eval tespit edildi!" -ForegroundColor Yellow
            }
            
            if ($csp -match "'unsafe-inline'" -and $csp -match "script-src") {
                Write-Host "⚠️ UYARI: script-src'de unsafe-inline tespit edildi!" -ForegroundColor Yellow
            }
            
        } else {
            Write-Host "❌ CSP Header bulunamadı!" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "❌ CSP test hatası: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Ana Test Fonksiyonu
Write-Host "`n=== LOCAL TEST ===" -ForegroundColor Cyan
Test-Headers $testUrl
Test-StaticAssets $testUrl
Test-CSP $testUrl

Write-Host "`n=== PRODUCTION TEST ===" -ForegroundColor Cyan
Test-Headers $prodUrl
Test-StaticAssets $prodUrl
Test-CSP $prodUrl

Write-Host "`n🔒 Güvenlik testi tamamlandı!" -ForegroundColor Green
Write-Host "Detayli loglar icin docker logs container_name komutunu kullanin." -ForegroundColor Blue
