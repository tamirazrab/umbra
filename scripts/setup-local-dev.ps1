# Local Development Setup Script for Windows PowerShell
# This script helps set up the local development environment

Write-Host "🚀 Umbra Local Development Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
$dockerComposeCmd = $null
if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
    $dockerComposeCmd = "docker-compose"
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} elseif (docker compose version 2>$null) {
    $dockerComposeCmd = "docker compose"
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} else {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from env.example..." -ForegroundColor Yellow
    if (Test-Path env.example) {
        Copy-Item env.example .env
        Write-Host "✅ .env file created" -ForegroundColor Green
        Write-Host "⚠️  Please review and update .env file with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "❌ env.example file not found" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Ask user if they want to start services
$response = Read-Host "Do you want to start all services now? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "🐳 Starting Docker services..." -ForegroundColor Cyan
    
    & $dockerComposeCmd.Split(' ') -f docker-compose.dev.yml up -d
    
    Write-Host ""
    Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    & $dockerComposeCmd.Split(' ') -f docker-compose.dev.yml ps
    
    Write-Host ""
    Write-Host "✅ Setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📚 Access your services:" -ForegroundColor Cyan
    Write-Host "   - PostgreSQL:    localhost:5432"
    Write-Host "   - PgAdmin:       http://localhost:5050"
    Write-Host "   - MongoDB:        localhost:27017"
    Write-Host "   - Mongo Express:  http://localhost:8081"
    Write-Host "   - Redis:          localhost:6379"
    Write-Host "   - Zipkin:         http://localhost:9411"
    Write-Host "   - Prometheus:     http://localhost:9090"
    Write-Host "   - Grafana:        http://localhost:3001"
    Write-Host "   - Alertmanager:   http://localhost:9093"
    Write-Host ""
    Write-Host "📖 For more information, see LOCAL_DEVELOPMENT_SETUP.md" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ℹ️  To start services later, run:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📖 For more information, see LOCAL_DEVELOPMENT_SETUP.md" -ForegroundColor Cyan
}

