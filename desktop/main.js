const { app, BrowserWindow, Menu, Tray, ipcMain, net, protocol, screen, session, shell } = require('electron');
const { execFile } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// instalada, a pasta web vai junto da app (resources\web); em desenvolvimento está ao lado de desktop
const PASTA_WEB = app.isPackaged ? path.join(process.resourcesPath, 'web') : path.join(__dirname, '..', 'web');
const ICONE = path.join(__dirname, 'icone.ico');
const LARGURA_LATERAL = 400;
const VIDRO = process.platform === 'win32';
let OPACIDADE = true;

// máquinas virtuais e ambiente remoto costumam ter as animações do Windows desligadas,
// o que desligava as animações do HUROH (como a entrada do menu lateral)
app.commandLine.appendSwitch('force-prefers-no-reduced-motion');

protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true } },
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


// idioma escolhido no instalador (fica num ficheiro ao lado do HUROH.exe)
function idiomaInstalacao() {
    if (!app.isPackaged) return null;
    try {
        const idioma = fs.readFileSync(path.join(path.dirname(process.execPath), 'idioma.txt'), 'utf8').trim();
        return ['pt', 'en', 'es'].includes(idioma) ? idioma : null;
    } catch {
        return null;
    }
}

function argumentos() {
    const lista = [];
    if (VIDRO) lista.push('--huroh-vidro');
    const idioma = idiomaInstalacao();
    if (idioma) lista.push('--huroh-idioma=' + idioma);
    return lista;
}


// uma só instância
// ======================================================
if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => mostrarJanela());

    app.whenReady().then(() => {
        app.setAppUserModelId('pt.huroh.app');
        OPACIDADE = podeUsarOpacidade();
        // só as notificações dos lembretes; câmara, microfone, localização, etc. ficam negados
        session.defaultSession.setPermissionRequestHandler((_conteudo, permissao, responder) => responder(permissao === 'notifications'));
        session.defaultSession.setPermissionCheckHandler((_conteudo, permissao) => permissao === 'notifications');
        // "Exportar dados" pergunta onde guardar, a começar pelas Transferências
        session.defaultSession.on('will-download', (_evento, item) => {
            item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('downloads'), item.getFilename()) });
        });
        servirFicheiros();
        ligarMensagens();
        // ao ligar o computador só abre o menu lateral; a janela abre quando for precisa
        if (ARRANQUE && lerConfig().lateral) criarLateral(true);
        else criarJanela();
        criarBandeja();
        atualizarArranque();
        prepararAtualizacoes();
        if (!app.isPackaged) vigiarAlteracoes();
        screen.on('display-metrics-changed', posicionarLateral);
    });
}

app.on('before-quit', () => { aSair = true; });
app.on('window-all-closed', () => {});


// ficheiros
// ======================================================
function servirFicheiros() {
    protocol.handle('app', pedido => {
        const endereco = new URL(pedido.url);
        const caminho = decodeURIComponent(endereco.pathname);
        const ficheiro = path.normalize(path.join(PASTA_WEB, caminho));

        if (endereco.host !== 'huroh' || !ficheiro.startsWith(PASTA_WEB + path.sep)) {
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

    contents.on('will-redirect', (evento, url) => {
        if (!url.startsWith('app://huroh/')) evento.preventDefault();
    });

    contents.on('will-attach-webview', evento => evento.preventDefault());

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
        show: false,
        ...(OPACIDADE ? { opacity: 0 } : {}),
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
            spellcheck: false,
            additionalArguments: argumentos(),
        },
    });

    // só aparece já desenhada; o menu lateral só é criado quando o dashboard acabar de abrir
    // a janela passa a sincronizar: o menu lateral para
    avisarSincronizacao();

    janela.once('ready-to-show', () => {
        janela.show();
        esperarPronta();
        setTimeout(() => { if (!lateral) criarLateral(); }, 3000);
    });

    // sem isto o Windows mostra na barra de tarefas o ícone do Electron (em desenvolvimento)
    if (process.platform === 'win32') {
        janela.setAppDetails({ appId: 'pt.huroh.app', appIconPath: app.isPackaged ? process.execPath : ICONE, appIconIndex: 0, relaunchDisplayName: 'HUROH' });
    }

    protegerNavegacao(janela.webContents);

    janela.webContents.on('did-navigate', (_evento, url) => {
        estiloInvisivel = null;
        ajustarTamanho(url.includes('login.html'));
    });
    janela.webContents.on('did-finish-load', () => ajustarTamanho(janela.webContents.getURL().includes('login.html')));

    janela.webContents.on('did-fail-load', (_evento, codigo) => {
        if (codigo !== -3) setTimeout(() => janela?.loadURL('app://huroh/index.html'), 1500);
    });

    janela.webContents.on('render-process-gone', () => janela?.reload());

    // Ctrl+Shift+I abre as ferramentas de programador (para ver a base de dados local)
    janela.webContents.on('before-input-event', (evento, tecla) => {
        if (tecla.type === 'keyDown' && tecla.control && tecla.shift && tecla.key.toLowerCase() === 'i') {
            evento.preventDefault();
            janela.webContents.toggleDevTools();
        }
    });

    janela.on('close', evento => {
        if (!aSair) {
            evento.preventDefault();
            esconderJanela('hide');
        }
    });

    // minimizar fica na barra de tarefas (esconder uma janela minimizada deixava-a presa no Windows)
    janela.on('restore', () => {
        janela.focus();
        janela.webContents.invalidate();
        janela.webContents.send('janela-mostrada');
        esperarPronta();
    });

    // a animação de abertura corre sempre que a janela volta a aparecer; enquanto está fora de vista fica
    // transparente, e só volta a ver-se quando a página avisa que já desenhou o início da abertura
    const esconder = () => {
        mudarOpacidade(0);
        janela.webContents.send('janela-escondida');
    };
    janela.on('hide', esconder);
    janela.on('minimize', esconder);
    janela.on('show', () => {
        janela.webContents.send('janela-mostrada');
        esperarPronta();
    });

    janela.on('closed', () => {
        janela = null;
        avisarSincronizacao();
    });
    janela.loadURL('app://huroh/index.html');
}

let seguranca = null;

function esperarPronta() {
    clearTimeout(seguranca);
    seguranca = setTimeout(mostrarPronta, 700);
}

function mostrarPronta() {
    clearTimeout(seguranca);
    mudarOpacidade(1);
}

function mudarOpacidade(valor) {
    if (!janela || janela.isDestroyed()) return Promise.resolve();
    if (OPACIDADE) return Promise.resolve(janela.setOpacity(valor));
    return mudarOpacidadePagina(valor);
}

// sem placa gráfica a opacidade é feita na própria página (a janela é transparente, por isso fica invisível)
let estiloInvisivel = null;

async function mudarOpacidadePagina(valor) {
    const conteudo = janela.webContents;
    try {
        if (valor === 0 && !estiloInvisivel) {
            estiloInvisivel = conteudo.insertCSS('html { opacity: 0 !important; }');
            await estiloInvisivel;
        } else if (valor === 1 && estiloInvisivel) {
            const chave = await estiloInvisivel;
            estiloInvisivel = null;
            await conteudo.removeInsertedCSS(chave);
        }
    } catch {
        estiloInvisivel = null;
    }
}

// antes de esconder, a página fica invisível e desenhada assim; ao voltar já não se vê o dashboard antigo
async function esconderJanela(acao) {
    if (!janela || janela.isDestroyed()) return;
    if (!OPACIDADE) {
        await mudarOpacidadePagina(0);
        const desenhada = janela.webContents.executeJavaScript('new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))');
        await Promise.race([desenhada, new Promise(r => setTimeout(r, 300))]).catch(() => {});
        await new Promise(r => setTimeout(r, 120));
        if (!janela || janela.isDestroyed()) return;
    }
    janela[acao]();
}

// sem placa gráfica (máquinas virtuais, ambiente remoto) a opacidade numa janela transparente
// deixa-a invisível, por isso aí a janela aparece sem o efeito de opacidade
function podeUsarOpacidade() {
    return String(app.getGPUFeatureStatus().gpu_compositing).startsWith('enabled');
}

// a janela de login fica com a altura do conteúdo (a página diz quanto precisa)
let alturaLogin = 600;

function ajustarAlturaLogin(altura) {
    if (!janela || !janela.webContents.getURL().includes('login.html')) return;
    const area = screen.getPrimaryDisplay().workArea;
    alturaLogin = Math.round(Math.min(Math.max(altura, 320), area.height - 40));
    const atual = janela.getBounds();
    if (atual.height === alturaLogin) return;

    janela.setResizable(true);
    janela.setBounds({
        x: atual.x,
        y: Math.max(area.y, Math.min(atual.y, area.y + area.height - alturaLogin)),
        width: atual.width,
        height: alturaLogin,
    });
    janela.setResizable(false);
}

function ajustarTamanho(login) {
    if (!janela) return;
    const area = screen.getPrimaryDisplay().workArea;
    const largura = login ? 440 : Math.min(1180, area.width - 40);
    const altura = login ? alturaLogin : Math.min(760, area.height - 40);
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

function avisarSincronizacao() {
    if (lateral && !lateral.isDestroyed()) lateral.webContents.send('sincronizar-sozinho', !janela);
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
function criarLateral(apresentar = false) {
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
            spellcheck: false,
            backgroundThrottling: false,
            additionalArguments: argumentos(),
        },
    });

    lateral.setAlwaysOnTop(true, 'floating');
    lateral.setVisibleOnAllWorkspaces(true);
    lateral.setIgnoreMouseEvents(true, { forward: true });

    protegerNavegacao(lateral.webContents);
    posicionarLateral();

    lateral.once('ready-to-show', () => {
        if (!lerConfig().lateral) return avisarLateral();
        lateral.showInactive();
        if (apresentar) setTimeout(apresentarLateral, 150);
        avisarLateral();
        vigiarRato();
    });
    lateral.on('closed', () => { lateral = null; });
    lateral.loadURL('app://huroh/lateral.html');
}

// o Windows nem sempre entrega os movimentos do rato a uma janela que os ignora,
// por isso a posição é lida aqui e enviada ao menu lateral
let vigiaRato = null;

function vigiarRato() {
    clearTimeout(vigiaRato);
    if (!lateralVisivel()) return;

    const rato = screen.getCursorScreenPoint();
    const limites = lateral.getBounds();
    const dentro = rato.x >= limites.x && rato.x < limites.x + limites.width &&
        rato.y >= limites.y && rato.y < limites.y + limites.height;

    lateral.webContents.send('rato', dentro ? { x: rato.x - limites.x, y: rato.y - limites.y } : null);
    vigiaRato = setTimeout(vigiarRato, dentro ? 40 : 120);
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
        if (!lateral || lateral.isDestroyed()) {
            guardarConfig({ lateral: true });
            return criarLateral(true);
        }
        lateral.showInactive();
        apresentarLateral();
        vigiarRato();
    } else {
        lateral?.setIgnoreMouseEvents(true, { forward: true });
        lateral?.hide();
    }

    guardarConfig({ lateral: visivel });
    avisarLateral(visivel);
}

function avisarLateral(visivel = lateralVisivel()) {
    janela?.webContents.send('lateral-mudou', visivel);
    atualizarBandeja();
}


// entrada: uma gota sai da janela principal e abre-se no menu lateral (a animação corre na própria página do menu)
// ======================================================
function apresentarLateral() {
    if (!lateral || lateral.isDestroyed()) return;

    const limites = lateral.getBounds();
    let origem = null;
    if (janela && janela.isVisible() && !janela.isMinimized() && !janela.webContents.getURL().includes('login.html')) {
        const caixa = janela.getBounds();
        origem = { x: caixa.x - limites.x, y: caixa.y + caixa.height / 2 - limites.y };
    }
    lateral.webContents.send('apresentar', origem);
}


// atualizações (pelos Releases do GitHub)
// ======================================================
// a app procura uma versão nova ao abrir e de 4 em 4 horas; com as atualizações automáticas ligadas,
// descarrega sozinha e instala quando a app fecha (ou já, se carregares em "Reiniciar e atualizar")
let atualizador = null;
const atualizacao = { estado: 'atualizada', nova: null, progresso: 0 };

function avisarAtualizacao(mudancas) {
    Object.assign(atualizacao, mudancas);
    janela?.webContents.send('atualizacao', estadoAtualizacao());
}

function estadoAtualizacao() {
    return {
        ...atualizacao,
        versao: app.getVersion(),
        auto: lerConfig().atualizacoesAuto !== false,
        disponivel: Boolean(atualizador),
    };
}

function prepararAtualizacoes() {
    if (!app.isPackaged) return;

    try {
        ({ autoUpdater: atualizador } = require('electron-updater'));
    } catch {
        return;
    }

    const auto = lerConfig().atualizacoesAuto !== false;
    atualizador.autoDownload = auto;
    atualizador.autoInstallOnAppQuit = auto;

    atualizador.on('checking-for-update', () => avisarAtualizacao({ estado: 'a-procurar' }));
    atualizador.on('update-not-available', () => avisarAtualizacao({ estado: 'atualizada', nova: null }));
    atualizador.on('update-available', info => avisarAtualizacao({ estado: atualizador.autoDownload ? 'a-descarregar' : 'disponivel', nova: info.version, progresso: 0 }));
    atualizador.on('download-progress', info => avisarAtualizacao({ estado: 'a-descarregar', progresso: Math.round(info.percent) }));
    atualizador.on('update-downloaded', info => avisarAtualizacao({ estado: 'pronta', nova: info.version, progresso: 100 }));
    atualizador.on('error', () => avisarAtualizacao({ estado: 'erro' }));

    const procurar = () => atualizador.checkForUpdates().catch(() => avisarAtualizacao({ estado: 'erro' }));
    setTimeout(procurar, 8000);
    setInterval(procurar, 4 * 60 * 60 * 1000);
}

function mudarAtualizacoesAuto(ligado) {
    guardarConfig({ atualizacoesAuto: ligado });
    if (atualizador) {
        atualizador.autoDownload = ligado;
        atualizador.autoInstallOnAppQuit = ligado;
        if (ligado && atualizacao.estado === 'disponivel') atualizador.downloadUpdate().catch(() => {});
    }
    avisarAtualizacao({});
}

function procurarAtualizacao() {
    if (!atualizador) return;
    if (atualizacao.estado === 'disponivel') {
        avisarAtualizacao({ estado: 'a-descarregar', progresso: 0 });
        atualizador.downloadUpdate().catch(() => avisarAtualizacao({ estado: 'erro' }));
        return;
    }
    atualizador.checkForUpdates().catch(() => avisarAtualizacao({ estado: 'erro' }));
}

function instalarAtualizacao() {
    if (!atualizador || atualizacao.estado !== 'pronta') return;
    aSair = true;
    atualizador.quitAndInstall(true, true);
}


// iniciar com o Windows
// ======================================================
const CHAVE_ARRANQUE = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
const ARRANQUE = process.argv.includes('--arranque');

function correrReg(argumentos) {
    return new Promise(resolver => {
        execFile('reg', argumentos, { windowsHide: true }, erro => resolver(!erro));
    });
}

function arranqueDisponivel() {
    return process.platform === 'win32';
}

// na app instalada é o HUROH.exe; a correr pelo run.bat é o Electron com a pasta da app
function comandoArranque() {
    const pasta = app.isPackaged ? '' : ` "${app.getAppPath()}"`;
    return `"${process.execPath}"${pasta} --arranque`;
}

function lerArranque() {
    if (!arranqueDisponivel()) return Promise.resolve(false);
    return correrReg(['query', CHAVE_ARRANQUE, '/v', 'HUROH']);
}

async function mudarArranque(ligado) {
    if (!arranqueDisponivel()) return false;
    if (ligado) {
        await correrReg(['add', CHAVE_ARRANQUE, '/v', 'HUROH', '/t', 'REG_SZ', '/d', comandoArranque(), '/f']);
    } else {
        await correrReg(['delete', CHAVE_ARRANQUE, '/v', 'HUROH', '/f']);
    }
    return lerArranque();
}

// quem já tinha o arranque ligado numa versão anterior passa a abrir só o menu lateral
async function atualizarArranque() {
    if (app.isPackaged && await lerArranque()) await mudarArranque(true);
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
const PAGINAS = ['dashboard', 'financas', 'agenda', 'tarefas', 'widgets', 'definicoes'];
const ACOES = ['despesa', 'rendimento', 'tarefa', 'evento'];

// só as páginas da própria app podem falar com o Electron
function daApp(evento) {
    return Boolean(evento.senderFrame?.url.startsWith('app://huroh/'));
}

function ligarMensagens() {
    const ouvir = (canal, funcao) => ipcMain.on(canal, (evento, ...dados) => {
        if (daApp(evento)) funcao(evento, ...dados);
    });

    ouvir('abrir', (_evento, pagina, acao) => {
        mostrarJanela(PAGINAS.includes(pagina) ? pagina : null, ACOES.includes(acao) ? acao : null);
    });

    ouvir('rato-ativo', (evento, ativo) => {
        const origem = BrowserWindow.fromWebContents(evento.sender);
        if (origem === lateral) {
            lateral.setIgnoreMouseEvents(!ativo, { forward: true });
        }
    });

    ouvir('pagina-atual', (_evento, pagina) => {
        if (PAGINAS.includes(pagina)) lateral?.webContents.send('pagina-atual', pagina);
    });

    ouvir('mostrar-lateral', (_evento, visivel) => mostrarLateral(Boolean(visivel)));
    ipcMain.handle('estado-lateral', evento => daApp(evento) && lateralVisivel());
    // sem a janela principal aberta, é o menu lateral que mantém os dados em dia
    ipcMain.handle('sincronizar-sozinho', evento => daApp(evento) && !janela);

    ouvir('sair', () => app.quit());

    ipcMain.handle('atualizacao-estado', evento => daApp(evento) && estadoAtualizacao());
    ouvir('atualizacao-auto', (_evento, ligado) => mudarAtualizacoesAuto(Boolean(ligado)));
    ouvir('atualizacao-procurar', () => procurarAtualizacao());
    ouvir('atualizacao-instalar', () => instalarAtualizacao());

    ouvir('janela-pronta', evento => {
        if (BrowserWindow.fromWebContents(evento.sender) === janela) mostrarPronta();
    });

    // o dashboard já abriu: agora cria-se o menu lateral (com a entrada)
    ouvir('app-pronta', evento => {
        if (BrowserWindow.fromWebContents(evento.sender) !== janela) return;
        if (!lateral) criarLateral(true);
    });

    ipcMain.handle('arranque', (evento, ligado) => {
        if (!daApp(evento)) return false;
        return typeof ligado === 'boolean' ? mudarArranque(ligado) : lerArranque();
    });
    ipcMain.handle('arranque-disponivel', evento => daApp(evento) && arranqueDisponivel());

    // só a janela principal guarda backups
    ipcMain.handle('guardar-backup', (evento, dia, conteudo) => {
        if (!daApp(evento) || BrowserWindow.fromWebContents(evento.sender) !== janela) return false;
        return guardarBackup(dia, conteudo);
    });

    ipcMain.handle('apagar-backups', evento => {
        if (!daApp(evento) || BrowserWindow.fromWebContents(evento.sender) !== janela) return false;
        return apagarBackups();
    });

    ipcMain.handle('google-preparar', evento => daApp(evento) && prepararGoogle(evento.sender));
    ouvir('google-abrir', (_evento, url) => abrirGoogle(url));
    ouvir('altura-login', (evento, altura) => {
        if (BrowserWindow.fromWebContents(evento.sender) === janela && Number.isFinite(altura)) ajustarAlturaLogin(altura);
    });

    ouvir('janela', (evento, acao) => {
        const origem = BrowserWindow.fromWebContents(evento.sender);
        if (origem !== janela) return;
        if (acao === 'minimizar') esconderJanela('minimize');
        if (acao === 'fechar') janela.close();
    });
}


// entrar com o Google
// ======================================================
// o login abre no navegador do PC; no fim o Supabase volta a arthrtx.github.io/HUROH/conta.html, que reencaminha para
// http://127.0.0.1:53682/google/<código>, onde esta pequena página entrega a sessão à app
const SUPABASE = 'https://mkcqjgvradohwlkunepi.supabase.co';
const PORTA_GOOGLE = 53682;
let servidorGoogle = null;

const PAGINA_GOOGLE = `<!doctype html><html lang="pt"><meta charset="utf-8"><title>HUROH</title>
<body style="font-family:system-ui,sans-serif;background:#111113;color:#f4f4f5;display:grid;place-items:center;height:100vh;margin:0">
<p id="t">A voltar para o HUROH...</p>
<script>
const corpo = location.hash.slice(1) + '&' + location.search.slice(1);
history.replaceState(null, '', location.pathname);
fetch(location.pathname + '/fim', { method: 'POST', body: corpo })
    .then(r => r.text()).then(texto => {
        document.getElementById('t').textContent = texto;
        setTimeout(() => window.close(), 1200);
    });
</script></body></html>`;

function fecharGoogle() {
    servidorGoogle?.close();
    servidorGoogle = null;
}

function prepararGoogle(destino) {
    fecharGoogle();
    const codigo = crypto.randomBytes(16).toString('hex');
    const caminho = `/google/${codigo}`;

    servidorGoogle = http.createServer((pedido, resposta) => {
        if (pedido.method === 'GET' && pedido.url.split('?')[0] === caminho) {
            resposta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
            resposta.end(PAGINA_GOOGLE);
            return;
        }

        if (pedido.method !== 'POST' || pedido.url !== caminho + '/fim') {
            resposta.writeHead(404);
            resposta.end();
            return;
        }

        let corpo = '';
        pedido.on('data', parte => {
            corpo += parte;
            if (corpo.length > 20000) pedido.destroy();
        });
        pedido.on('end', () => {
            const dados = new URLSearchParams(corpo);
            const sessao = {
                access_token: dados.get('access_token'),
                refresh_token: dados.get('refresh_token'),
            };
            const correu = Boolean(sessao.access_token && sessao.refresh_token);

            resposta.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            resposta.end(correu ? 'Pronto, já entraste no HUROH. Este separador pode ser fechado.' : 'Não foi possível entrar. Volta ao HUROH e tenta outra vez.');

            if (!destino.isDestroyed()) destino.send('google-resultado', correu ? sessao : null);
            mostrarJanela();
            fecharGoogle();
        });
    });

    servidorGoogle.on('error', () => {
        if (!destino.isDestroyed()) destino.send('google-resultado', null);
        fecharGoogle();
    });
    servidorGoogle.listen(PORTA_GOOGLE, '127.0.0.1');

    const este = servidorGoogle;
    setTimeout(() => { if (servidorGoogle === este) fecharGoogle(); }, 5 * 60 * 1000);

    // o Supabase só aceita voltar ao site do HUROH; a página conta.html reencaminha para aqui
    return `https://arthrtx.github.io/HUROH/conta.html?app=${encodeURIComponent(`http://127.0.0.1:${PORTA_GOOGLE}${caminho}`)}`;
}

function abrirGoogle(url) {
    if (servidorGoogle && typeof url === 'string' && url.startsWith(SUPABASE + '/auth/v1/authorize?')) {
        shell.openExternal(url);
    }
}


// backups
// ======================================================
const MAXIMO_BACKUPS = 14;

const TAMANHO_MAXIMO = 50 * 1024 * 1024;

function guardarBackup(dia, conteudo) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return false;
    if (typeof conteudo !== 'string' || conteudo.length > TAMANHO_MAXIMO) return false;

    try {
        const pasta = path.join(app.getPath('documents'), 'HUROH', 'backups');
        fs.mkdirSync(pasta, { recursive: true });
        fs.writeFileSync(path.join(pasta, `huroh-${dia}.json`), conteudo, 'utf8');

        const antigos = fs.readdirSync(pasta)
            .filter(nome => /^huroh-\d{4}-\d{2}-\d{2}\.json$/.test(nome))
            .sort()
            .slice(0, -MAXIMO_BACKUPS);
        antigos.forEach(nome => fs.unlinkSync(path.join(pasta, nome)));
        return true;
    } catch (erro) {
        console.log('Não foi possível guardar o backup:', erro.message);
        return false;
    }
}


// ao apagar a conta, o utilizador pode apagar também os backups deste PC
function apagarBackups() {
    try {
        const pasta = path.join(app.getPath('documents'), 'HUROH', 'backups');
        fs.readdirSync(pasta)
            .filter(nome => /^huroh-\d{4}-\d{2}-\d{2}\.json$/.test(nome))
            .forEach(nome => fs.unlinkSync(path.join(pasta, nome)));
        return true;
    } catch {
        return false;
    }
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
