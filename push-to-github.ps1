$OWNER = "Muhammadumma"
$REPO = "the-admin-app"
$BRANCH = "main"
$BASE_DIR = "c:\Users\IMASS\theadmin\the-admin-app-main"
$WEB_DIR = "c:\Users\IMASS\.gemini\antigravity-ide\scratch\the-webapp"

# Load token: 1) System env var, 2) Admin app .env, 3) Webapp .env
$TOKEN = $env:GITHUB_TOKEN
if (-not $TOKEN -and (Test-Path "$BASE_DIR\.env")) {
    $tokenLine = Get-Content "$BASE_DIR\.env" | Where-Object { $_ -match '^VITE_GITHUB_TOKEN=(.+)' }
    if ($tokenLine) { $TOKEN = $Matches[1].Trim() }
}
if (-not $TOKEN -and (Test-Path "$WEB_DIR\.env")) {
    $tokenLine = Get-Content "$WEB_DIR\.env" | Where-Object { $_ -match '^VITE_GITHUB_TOKEN=(.+)' }
    if ($tokenLine) { $TOKEN = $Matches[1].Trim() }
}

if (-not $TOKEN) {
    Write-Error "ERROR: GitHub Token not found. Set GITHUB_TOKEN env var or add VITE_GITHUB_TOKEN to $BASE_DIR\.env"
    exit 1
}

$HEADERS = @{
    "Authorization" = "Bearer $TOKEN"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

function Push-File {
    param([string]$RepoPath, [string]$LocalPath, [string]$CommitMsg)
    if (-not (Test-Path $LocalPath)) {
        Write-Host "SKIP: $LocalPath"
        return
    }
    $bytes = [System.IO.File]::ReadAllBytes($LocalPath)
    $b64 = [Convert]::ToBase64String($bytes)
    $apiUrl = "https://api.github.com/repos/$OWNER/$REPO/contents/$RepoPath"
    $sha = $null
    try {
        $existing = Invoke-RestMethod -Uri $apiUrl -Headers $HEADERS -Method Get -ErrorAction Stop
        $sha = $existing.sha
    } catch {}
    $body = @{ message = $CommitMsg; content = $b64; branch = $BRANCH }
    if ($sha) { $body["sha"] = $sha }
    try {
        $result = Invoke-RestMethod -Uri $apiUrl -Headers $HEADERS -Method Put -Body ($body | ConvertTo-Json -Depth 3) -ContentType "application/json"
        Write-Host "OK: $RepoPath"
    } catch {
        Write-Host "FAIL: $RepoPath - $($_.Exception.Message)"
    }
}

$adminMsg = "UI polish: institutional terminology, improved document viewer, flexible clearance queue"
$webMsg = "GitHub storage integration, requirements live sync, dynamic upload screen"

Push-File "src/components/clearance/DocumentViewer.tsx" "$BASE_DIR\src\components\clearance\DocumentViewer.tsx" $adminMsg
Push-File "src/views/ClearanceView.tsx" "$BASE_DIR\src\views\ClearanceView.tsx" $adminMsg
Push-File "firestore.rules" "$BASE_DIR\firestore.rules" $adminMsg
Push-File "student-app/src/context/ClearanceContext.tsx" "$WEB_DIR\src\context\ClearanceContext.tsx" $webMsg
Push-File "student-app/src/screens/DocumentUploadScreen.tsx" "$WEB_DIR\src\screens\DocumentUploadScreen.tsx" $webMsg
Push-File "student-app/src/services/githubStorageService.ts" "$WEB_DIR\src\services\githubStorageService.ts" $webMsg
Push-File "student-app/ARCHITECTURE_AND_DB_SPEC.md" "$WEB_DIR\ARCHITECTURE_AND_DB_SPEC.md" $webMsg
Push-File "student-app/src/views/ClearanceView.tsx" "$BASE_DIR\src\views\ClearanceView.tsx" $adminMsg

Write-Host "Done. https://github.com/$OWNER/$REPO"
