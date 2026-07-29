param(
    [Parameter(Position = 0)]
    [string]$Frage
)

$ErrorActionPreference = 'Stop'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false)
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

if ([string]::IsNullOrWhiteSpace($Frage)) {
    $Frage = Read-Host 'Suchfrage'
}
if ([string]::IsNullOrWhiteSpace($Frage)) {
    [Console]::Error.WriteLine('Es wurde keine Suchfrage eingegeben.')
    exit 2
}

$nodeScript = Join-Path -Path $PSScriptRoot -ChildPath 'Suchen.mjs'
if (-not (Test-Path -LiteralPath $nodeScript -PathType Leaf)) {
    [Console]::Error.WriteLine('Suchen.mjs fehlt im Skriptordner.')
    exit 3
}

$exitCode = 0
Push-Location -LiteralPath $PSScriptRoot
try {
    & node $nodeScript $Frage
    $exitCode = $LASTEXITCODE
} catch {
    [Console]::Error.WriteLine("Die Suche konnte nicht gestartet werden: $($_.Exception.Message)")
    $exitCode = 4
} finally {
    Pop-Location
}

exit $exitCode
