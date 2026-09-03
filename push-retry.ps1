$OWNER = "Muhammadumma"
$REPO = "the-admin-app"
$BRANCH = "main"
$ADMIN_DIR = "c:\Users\IMASS\theadmin\the-admin-app-main"
$WEB_DIR = "c:\Users\IMASS\.gemini\antigravity-ide\scratch\the-webapp"

# Load token: 1) System env var, 2) Admin app .env, 3) Webapp .env
$TOKEN = $env:GITHUB_TOKEN
if (-not $TOKEN -and (Test-Path "$ADMIN_DIR\.env")) {
    $tokenLine = Get-Content "$ADMIN_DIR\.env" | Where-Object { $_ -match '^VITE_GITHUB_TOKEN=(.+)' }
    if ($tokenLine) { $TOKEN = $Matches[1].Trim() }
}
if (-not $TOKEN -and (Test-Path "$WEB_DIR\.env")) {
    $tokenLine = Get-Content "$WEB_DIR\.env" | Where-Object { $_ -match '^VITE_GITHUB_TOKEN=(.+)' }
    if ($tokenLine) { $TOKEN = $Matches[1].Trim() }
}

if (-not $TOKEN) {
    Write-Error "ERROR: GitHub Token not found. Set GITHUB_TOKEN env var or add VITE_GITHUB_TOKEN to $ADMIN_DIR\.env"
    exit 1
}

$HEADERS = @{
    "Authorization" = "Bearer $TOKEN"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

function Push-File {
    param([string]$RepoPath, [string]$LocalPath, [string]$CommitMsg)
    $bytes = [System.IO.File]::ReadAllBytes($LocalPath)
    $b64 = [Convert]::ToBase64String($bytes)
    $apiUrl = "https://api.github.com/repos/$OWNER/$REPO/contents/$RepoPath"
    
    # Force getting SHA from 'main' branch specifically
    $sha = $null
    try {
        $existing = Invoke-RestMethod -Uri "$apiUrl`?ref=$BRANCH" -Headers $HEADERS -Method Get -ErrorAction Stop
        $sha = $existing.sha
    } catch {}
    
    $body = @{ message = $CommitMsg; content = $b64; branch = $BRANCH }
    if ($sha) { $body["sha"] = $sha }
    try {
        $result = Invoke-RestMethod -Uri $apiUrl -Headers $HEADERS -Method Put -Body ($body | ConvertTo-Json -Depth 3) -ContentType "application/json"
        Write-Host "OK: $RepoPath"
    } catch {
        Write-Host "FAIL: $RepoPath - $($_.Exception.Message)"
        # Print inner details for debug
        try {
            $errBody = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errBody)
            Write-Host $reader.ReadToEnd()
        } catch {}
    }
}

$webMsg = "Fix githubStorageService.ts sync"
Push-File "student-app/src/services/githubStorageService.ts" "$WEB_DIR\src\services\githubStorageService.ts" $webMsg
