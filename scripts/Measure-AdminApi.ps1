param(
    [string]$BaseUrl = 'http://localhost:8080/edushare/api/v1',
    [ValidateRange(1, 20)][int]$Samples = 3,
    [PSCredential]$Credential
)

$ErrorActionPreference = 'Stop'
if (-not $Credential) {
    $Credential = Get-Credential -UserName 'admin' -Message 'Tài khoản admin đang sử dụng'
}
$BaseUrl = $BaseUrl.TrimEnd('/')
$csrf = Invoke-RestMethod "$BaseUrl/auth/csrf" -SessionVariable adminSession -TimeoutSec 30
$headers = @{}
$headers[$csrf.result.headerName] = $csrf.result.token
$body = @{ email = $Credential.UserName; password = $Credential.GetNetworkCredential().Password } | ConvertTo-Json
try {
    $null = Invoke-RestMethod "$BaseUrl/auth/token" -Method Post -WebSession $adminSession -Headers $headers -ContentType 'application/json' -Body $body -TimeoutSec 30
} finally {
    $body = $null
}

$measurements = foreach ($path in @('/users/me', '/admin/overview', '/admin/users', '/admin/faculties', '/admin/majors', '/admin/subjects')) {
    foreach ($sample in 1..$Samples) {
        $timer = [Diagnostics.Stopwatch]::StartNew()
        try {
            $null = Invoke-RestMethod "$BaseUrl$path" -WebSession $adminSession -TimeoutSec 30
            [pscustomobject]@{ Endpoint = $path; Sample = $sample; Milliseconds = $timer.ElapsedMilliseconds; Status = 'OK' }
        } catch {
            [pscustomobject]@{ Endpoint = $path; Sample = $sample; Milliseconds = $timer.ElapsedMilliseconds; Status = $_.Exception.Message }
        }
    }
}
$measurements | Format-Table -AutoSize
