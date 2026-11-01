<#
.SYNOPSIS
    Confluo Preflight Check Script for Live Demo and Local Validation.
.DESCRIPTION
    Probes the three Confluo processes (Runner, Spring Boot Backend, Frontend Dev Server)
    and outputs PASS or FAIL for each service.
#>

param(
    [string]$RunnerUrl = "http://127.0.0.1:4000",
    [string]$BackendUrl = "http://localhost:8080",
    [string]$FrontendUrl = "http://localhost:5173"
)

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     Confluo Preflight Service Checks     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$allPass = $true

# 1. Check Runner Service
Write-Host "Checking Runner Service ($RunnerUrl/health)..." -NoNewline
try {
    $runnerResponse = Invoke-RestMethod -Uri "$RunnerUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    if ($runnerResponse -and $runnerResponse.status -eq "ok") {
        Write-Host " [PASS]" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "  -> Unexpected response from runner: $($runnerResponse | ConvertTo-Json -Compress)" -ForegroundColor Yellow
        $allPass = $false
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "  -> Error contacting runner: $($_.Exception.Message)" -ForegroundColor Yellow
    $allPass = $false
}

# 2. Check Backend Service
Write-Host "Checking Backend Service ($BackendUrl)..." -NoNewline
try {
    # Any HTTP response (including 401 Unauthorized or 403 Forbidden) indicates the Spring Boot server is alive and answering
    $backendRequest = [System.Net.HttpWebRequest]::Create("$BackendUrl/api/projects")
    $backendRequest.Timeout = 5000
    $backendRequest.Method = "GET"
    try {
        $backendResponse = $backendRequest.GetResponse()
        $statusCode = [int]$backendResponse.StatusCode
        $backendResponse.Close()
    } catch [System.Net.WebException] {
        if ($_.Response) {
            $statusCode = [int]$_.Response.StatusCode
            $_.Response.Close()
        } else {
            throw $_
        }
    }

    if ($statusCode -gt 0) {
        Write-Host " [PASS] (HTTP $statusCode)" -ForegroundColor Green
    } else {
        Write-Host " [FAIL]" -ForegroundColor Red
        $allPass = $false
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "  -> Error contacting backend: $($_.Exception.Message)" -ForegroundColor Yellow
    $allPass = $false
}

# 3. Check Frontend Dev Server
Write-Host "Checking Frontend Dev Server ($FrontendUrl)..." -NoNewline
try {
    $frontendRequest = [System.Net.HttpWebRequest]::Create($FrontendUrl)
    $frontendRequest.Timeout = 5000
    $frontendRequest.Method = "GET"
    try {
        $frontendResponse = $frontendRequest.GetResponse()
        $statusCode = [int]$frontendResponse.StatusCode
        $frontendResponse.Close()
    } catch [System.Net.WebException] {
        if ($_.Response) {
            $statusCode = [int]$_.Response.StatusCode
            $_.Response.Close()
        } else {
            throw $_
        }
    }

    if ($statusCode -eq 200) {
        Write-Host " [PASS] (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] (HTTP $statusCode)" -ForegroundColor Red
        $allPass = $false
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Host "  -> Error contacting frontend: $($_.Exception.Message)" -ForegroundColor Yellow
    $allPass = $false
}

Write-Host ""
if ($allPass) {
    Write-Host "ALL PREFLIGHT CHECKS PASSED. SYSTEM READY FOR DEMO." -ForegroundColor Green
    exit 0
} else {
    Write-Host "ONE OR MORE PREFLIGHT CHECKS FAILED." -ForegroundColor Red
    Write-Host "Please start the missing processes in order: Runner -> Backend -> Frontend." -ForegroundColor Yellow
    exit 1
}
