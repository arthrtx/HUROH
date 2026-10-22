# publica o proximo update da fila no GitHub (um por execucao)
# ======================================================
$fila = $PSScriptRoot
$repo = Split-Path -Parent $fila
$registo = Join-Path $fila 'publicar.log'
$publicados = Join-Path $fila 'publicados'

function Escrever($texto) {
    $linha = "$(Get-Date -Format 'yyyy-MM-dd HH:mm')  $texto"
    Add-Content -Path $registo -Value $linha -Encoding UTF8
    Write-Host $linha
}

Set-Location $repo

# a pasta .fila nunca vai para o GitHub
$exclude = Join-Path $repo '.git\info\exclude'
if (-not (Select-String -Path $exclude -Pattern '^\.fila/' -Quiet -ErrorAction SilentlyContinue)) {
    Add-Content -Path $exclude -Value '.fila/'
}

New-Item -ItemType Directory -Force -Path $publicados | Out-Null

$proximo = Get-ChildItem -Path $fila -Filter '*.patch' | Sort-Object Name | Select-Object -First 1
if (-not $proximo) {
    Escrever 'Fila vazia: ja nao ha updates para publicar.'
    exit 0
}

if (git status --porcelain --untracked-files=no) {
    Escrever "Parado: ha alteracoes por guardar no projeto. Faz commit (ou descarta) e volta a correr. Proximo: $($proximo.Name)"
    exit 1
}

git pull --ff-only -q
if ($LASTEXITCODE -ne 0) {
    Escrever 'Parado: o git pull falhou (sem internet ou historico diferente do GitHub).'
    exit 1
}

git am --3way --ignore-date -q $proximo.FullName
if ($LASTEXITCODE -ne 0) {
    git am --abort
    Escrever "Parado: o update $($proximo.Name) nao encaixa no codigo atual. Pede ajuda ao Claude."
    exit 1
}

git push -q
if ($LASTEXITCODE -ne 0) {
    Escrever "Atencao: o update $($proximo.Name) ficou guardado no PC mas o push falhou. Corre 'git push' a mao."
    Move-Item -Path $proximo.FullName -Destination $publicados -Force
    exit 1
}

Move-Item -Path $proximo.FullName -Destination $publicados -Force
$restam = (Get-ChildItem -Path $fila -Filter '*.patch').Count
Escrever "Publicado: $($proximo.Name). Faltam $restam."
