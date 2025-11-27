# PowerShell script to set up Git repository for Statsor platform
Write-Host "Setting up Git repository for Statsor platform..." -ForegroundColor Green
Write-Host ""

# Navigate to project directory
Set-Location "c:\Users\JOE\Downloads\mm"

# Try to find Git executable
$gitPath = $null
$possiblePaths = @(
    "C:\Program Files\Git\bin\git.exe",
    "C:\Program Files (x86)\Git\bin\git.exe",
    "C:\Git\bin\git.exe"
)

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $gitPath = $path
        break
    }
}

if ($null -eq $gitPath) {
    Write-Host "Error: Git executable not found in common locations." -ForegroundColor Red
    Write-Host "Please ensure Git is installed and accessible." -ForegroundColor Yellow
    Write-Host "You can download Git from: https://git-scm.com/downloads" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Git found at: $gitPath" -ForegroundColor Green
Write-Host ""

# Initialize Git repository
Write-Host "Initializing Git repository..." -ForegroundColor Cyan
& $gitPath init
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error initializing Git repository." -ForegroundColor Red
    pause
    exit 1
}

# Configure Git user
Write-Host "Configuring Git user..." -ForegroundColor Cyan
& $gitPath config --global user.name "Statsor Developer"
& $gitPath config --global user.email "developer@statsor.com"

# Add all files
Write-Host "Adding files to repository..." -ForegroundColor Cyan
& $gitPath add .

# Make initial commit
Write-Host "Making initial commit..." -ForegroundColor Cyan
& $gitPath commit -m "Initial commit: Statsor football management platform with fixed API integrations"

# Add remote origin
Write-Host "Adding remote origin..." -ForegroundColor Cyan
& $gitPath remote add origin https://github.com/Michael-ctrl-eng/teamplaymate-16.git

Write-Host ""
Write-Host "Git repository setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To push to GitHub, run:" -ForegroundColor Yellow
Write-Host "  & `"$gitPath`" push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you get authentication errors, you'll need to set up a Personal Access Token on GitHub." -ForegroundColor Yellow
Write-Host ""
pause