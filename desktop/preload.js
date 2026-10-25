const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('huroh', {
    desktop: true,
    vidro: process.argv.includes('--huroh-vidro'),
    versao: '2.1.0',

    abrir: (pagina, acao) => ipcRenderer.send('abrir', pagina, acao),
    ratoAtivo: ativo => ipcRenderer.send('rato-ativo', ativo),
    paginaAtual: pagina => ipcRenderer.send('pagina-atual', pagina),
    esconderLateral: () => ipcRenderer.send('mostrar-lateral', false),
    mostrarLateral: visivel => ipcRenderer.send('mostrar-lateral', visivel),
    estadoLateral: () => ipcRenderer.invoke('estado-lateral'),
    sair: () => ipcRenderer.send('sair'),
    janela: acao => ipcRenderer.send('janela', acao),

    aoNavegar: funcao => ipcRenderer.on('navegar', (_evento, pagina) => funcao(pagina)),
    aoAcao: funcao => ipcRenderer.on('acao', (_evento, acao) => funcao(acao)),
    aoMudarPagina: funcao => ipcRenderer.on('pagina-atual', (_evento, pagina) => funcao(pagina)),
    aoMudarLateral: funcao => ipcRenderer.on('lateral-mudou', (_evento, visivel) => funcao(visivel)),
});
