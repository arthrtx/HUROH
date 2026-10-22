# cria uma tarefa do Windows que publica 1 update por dia
# ======================================================
param([string]$Hora = '20:00')

$script = Join-Path $PSScriptRoot 'publicar.ps1'

$acao = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$quando = New-ScheduledTaskTrigger -Daily -At $Hora
$opcoes = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

Register-ScheduledTask -TaskName 'HUROH - publicar update' -Action $acao -Trigger $quando -Settings $opcoes -Force | Out-Null

Write-Host "Pronto. Todos os dias as $Hora e publicado 1 update (se o PC estiver desligado, publica quando ligar)."
Write-Host 'Para ver o que ja foi publicado: abre .fila\publicar.log'
Write-Host "Para parar: Unregister-ScheduledTask -TaskName 'HUROH - publicar update'"
