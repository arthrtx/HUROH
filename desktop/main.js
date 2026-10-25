const { app, BrowserWindow, Menu, Tray, ipcMain, net, protocol, screen, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PASTA_WEB = path.join(__dirname, '..', 'web');
const ICONE = path.join(__dirname, 'icone.ico');
const LARGURA_LATERAL = 400;
const VIDRO = process.platform === 'win32';

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

let janela = null;
let lateral = null;
let bandeja = null;
let aSair = false;


// preferências
// ======================================================
const FICHEIRO_CONFIG = () => path.join(app.getPath('userData'), 'config.json');

function lerConfig() {
    try {
        return { lateral: true, ...JSON.parse(fs.readFileSync(FICHEIRO_CONFIG(), 'utf8')) };
    } catch {
        return { lateral: true };
    }
}

function guardarConfig(alteracoes) {
    try {
        fs.writeFileSync(FICHEIRO_CONFIG(), JSON.stringify({ ...lerConfig(), ...alteracoes }, null, 2));
    } catch {}
}


// uma só instância
// ======================================================
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => mostrarJanela());

    app.whenReady().then(() => {
        app.setAppUserModelId('pt.huroh.app');
        servirFicheiros();
        ligarMensagens();
        criarJanela();
        criarLateral();
        criarBandeja();
        vigiarAlteracoes();
        screen.on('display-metrics-changed', posicionarLateral);
    });
}

app.on('before-quit', () => { aSair = true; });
app.on('window-all-closed', () => {});


// ficheiros
// ======================================================
function servirFicheiros() {
    protocol.handle('app', pedido => {
        const caminho = decodeURIComponent(new URL(pedido.url).pathname);
        const ficheiro = path.normalize(path.join(PASTA_WEB, caminho));

        if (!ficheiro.startsWith(PASTA_WEB)) {
            return new Response('Não encontrado', { status: 404 });
        }

        return net.fetch(pathToFileURL(ficheiro).toString());
    });
}

function protegerNavegacao(contents) {
    contents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://')) shell.openExternal(url);
        return { action: 'deny' };
    });

    contents.on('will-navigate', (evento, url) => {
        if (!url.startsWith('app://huroh/')) evento.preventDefault();
    });

    contents.on('console-message', (_evento, nivel, mensagem, linha, origem) => {
        if (nivel >= 2 && !mensagem.includes('Electron Security Warning')) {
            console.log(`[erro] ${mensagem} (${origem.replace('app://huroh/', '')}:${linha})`);
        }
    });
}


// janela principal
// ======================================================
function criarJanela() {
    const area = screen.getPrimaryDisplay().workAreaSize;

    const largura = Math.min(1180, area.width - 40);
    const altura = Math.min(760, area.height - 40);

    janela = new BrowserWindow({
        width: largura,
        height: altura,
        center: true,
        resizable: false,
        maximizable: false,
        fullscreenable: false,
        show: true,
        transparent: VIDRO,
        backgroundColor: VIDRO ? '#00000000' : '#111113',
        title: 'HUROH',
        icon: ICONE,
        frame: false,
        roundedCorners: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: true,
            additionalArguments: VIDRO ? ['--huroh-vidro'] : [],
        },
    });

    protegerNavegacao(janela.webContents);

    janela.webContents.on('did-navigate', (_evento, url) => ajustarTamanho(url.includes('login.html')));
    janela.webContents.on('did-finish-load', () => ajustarTamanho(janela.webContents.getURL().includes('login.html')));

    janela.webContents.on('did-fail-load', (_evento, codigo) => {
        if (codigo !== -3) setTimeout(() => janela?.loadURL('app://huroh/index.html'), 1500);
    });

    janela.webContents.on('render-process-gone', () => janela?.reload());

    janela.on('close', evento => {
        if (!aSair) {
            evento.preventDefault();
            janela.hide();
        }
    });

    janela.on('minimize', () => janela.hide());

    janela.on('closed', () => { janela = null; });
    janela.loadURL('app://huroh/index.html');
}

function ajustarTamanho(login) {
    if (!janela) return;
    const area = screen.getPrimaryDisplay().workArea;
    const largura = login ? 440 : Math.min(1180, area.width - 40);
    const altura = login ? 600 : Math.min(760, area.height - 40);
    const [atualL, atualA] = janela.getSize();
    if (atualL === largura && atualA === altura) return;

    janela.setResizable(true);
    janela.setBounds({
        x: Math.round(area.x + (area.width - largura) / 2),
        y: Math.round(area.y + (area.height - altura) / 2),
        width: largura,
        height: altura,
    });
    janela.setResizable(false);
}

function mostrarJanela(pagina, acao) {
    if (!janela || janela.isDestroyed()) criarJanela();
    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();

    if (pagina) janela.webContents.send('navegar', pagina);
    if (acao) janela.webContents.send('acao', acao);
}


// menu lateral
// ======================================================
function criarLateral() {
    lateral = new BrowserWindow({
        width: LARGURA_LATERAL,
        height: 600,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        fullscreenable: false,
        skipTaskbar: true,
        alwaysOnTop: true,
        hasShadow: false,
        show: false,
        focusable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: true,
            backgroundThrottling: false,
        },
    });

    lateral.setAlwaysOnTop(true, 'floating');
    lateral.setVisibleOnAllWorkspaces(true);
    lateral.setIgnoreMouseEvents(true, { forward: true });

    protegerNavegacao(lateral.webContents);
    posicionarLateral();

    lateral.once('ready-to-show', () => {
        if (lerConfig().lateral) lateral.showInactive();
        avisarLateral();
    });
    lateral.on('closed', () => { lateral = null; });
    lateral.loadURL('app://huroh/lateral.html');
}

function posicionarLateral() {
    if (!lateral) return;
    const area = screen.getPrimaryDisplay().workArea;
    lateral.setBounds({ x: area.x, y: area.y, width: LARGURA_LATERAL, height: area.height });
}

function lateralVisivel() {
    return Boolean(lateral && !lateral.isDestroyed() && lateral.isVisible());
}

function mostrarLateral(visivel) {
    if (visivel) {
        if (!lateral || lateral.isDestroyed()) criarLateral();
        lateral.showInactive();
    } else {
        lateral?.hide();
    }

    guardarConfig({ lateral: visivel });
    avisarLateral(visivel);
}

function avisarLateral(visivel = lateralVisivel()) {
    janela?.webContents.send('lateral-mudou', visivel);
    atualizarBandeja();
}


// bandeja
// ======================================================
function criarBandeja() {
    try {
        bandeja = new Tray(ICONE);
    } catch (erro) {
        console.log('Não foi possível criar o ícone na bandeja:', erro.message);
        return;
    }
    bandeja.setToolTip('HUROH');
    bandeja.on('click', () => mostrarJanela());
    atualizarBandeja();
}

function atualizarBandeja() {
    if (!bandeja) return;

    bandeja.setContextMenu(Menu.buildFromTemplate([
        { label: 'Abrir HUROH', click: () => mostrarJanela() },
        { label: 'Nova despesa', click: () => mostrarJanela('dashboard', 'despesa') },
        { type: 'separator' },
        {
            label: 'Menu lateral',
            type: 'checkbox',
            checked: lateralVisivel(),
            click: () => mostrarLateral(!lateralVisivel()),
        },
        { type: 'separator' },
        { label: 'Sair', click: () => app.quit() },
    ]));
}


// mensagens das páginas
// ======================================================
function ligarMensagens() {
    ipcMain.on('abrir', (_evento, pagina, acao) => mostrarJanela(pagina, acao));

    ipcMain.on('rato-ativo', (evento, ativo) => {
        const origem = BrowserWindow.fromWebContents(evento.sender);
        if (origem === lateral) {
            lateral.setIgnoreMouseEvents(!ativo, { forward: true });
        }
    });

    ipcMain.on('pagina-atual', (_evento, pagina) => {
        lateral?.webContents.send('pagina-atual', pagina);
    });

    ipcMain.on('mostrar-lateral', (_evento, visivel) => mostrarLateral(Boolean(visivel)));
    ipcMain.handle('estado-lateral', () => lateralVisivel());

    ipcMain.on('sair', () => app.quit());

    ipcMain.on('janela', (evento, acao) => {
        const origem = BrowserWindow.fromWebContents(evento.sender);
        if (origem !== janela) return;
        if (acao === 'minimizar') janela.minimize();
        if (acao === 'fechar') janela.close();
    });
}


// recarregar ao guardar
// ======================================================
let temporizador;

function vigiarAlteracoes() {
    try {
        fs.watch(PASTA_WEB, { recursive: true }, (_tipo, ficheiro) => {
            clearTimeout(temporizador);
            temporizador = setTimeout(() => {
                console.log(`[${new Date().toLocaleTimeString('pt-PT')}] alterado: ${ficheiro}, a recarregar`);
                janela?.webContents.reloadIgnoringCache();
                lateral?.webContents.reloadIgnoringCache();
            }, 300);
        });
    } catch {
        console.log('Não foi possível vigiar a pasta web; usa Ctrl+R para recarregar.');
    }
}
