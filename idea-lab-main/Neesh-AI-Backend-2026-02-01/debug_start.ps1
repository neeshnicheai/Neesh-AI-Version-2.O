$envContent = Get-Content .env
foreach ($line in $envContent) {
    if ($line -match '^([^#=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path env:$name -Value $value
        Write-Host "Set env var: $name"
    }
}

Write-Host "Starting Backend..."
mvn spring-boot:run > debug_run.log 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend failed with exit code $LASTEXITCODE"
    Get-Content debug_run.log | Select-Object -Last 100
} else {
    Write-Host "Backend started successfully (or so it seems, check logs)"
}
