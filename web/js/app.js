import { local, t } from './idioma.js';
import { obterSessao, supabase } from './supabase.js';
import { abrirBd, lerMeta } from './bd.js';
import { iniciarSincronizacao, sincronizar, terminarSessao } from './sincronizar.js';
import './janela.js';
import { exigirTermos, mostrarTermos } from './termos.js';
import { icone } from './icones.js';
import { iniciarDefinicoes } from './definicoes.js';
import { carregarPerfil, iniciarPerfil, perfilAtual } from './perfil.js';
import { iniciarCategorias } from './categorias.js';
import { abrirMovimento, iniciarMovimentos } from './movimentos.js';
import { iniciarResumo } from './resumo.js';
import { abrirTarefa, iniciarTarefas } from './tarefas.js';
import { abrirEvento, iniciarAgenda } from './agenda.js';
import { iniciarCalendario } from './calendario.js';
import { iniciarDashboard } from './dashboard.js';
import { iniciarNotificacoes } from './notificacoes.js';
import { iniciarTopo } from './topo.js';
import { iniciarVersao } from './versao.js';


// abertura: o nome HUROH aparece e cresce até virar a janela (sempre que a app abre)
// ======================================================
const comAbertura = Boolean(window.huroh?.desktop);
let inicioAbertura = performance.now();
let preparada = false;
if (!comAbertura) document.body.classList.remove('abertura');

// ao esconder ou minimizar, a janela fica já no início da abertura, para a animação correr quando voltar
window.huroh?.aoEsconderJanela?.(() => {
    if (document.body.classList.contains('a-carregar')) return;
    preparada = true;
    document.body.classList.remove('a-abrir', 'a-revelar');
    document.body.classList.add('a-carregar', 'abertura');
});

window.huroh?.aoMostrarJanela?.(() => {
    if (!preparada) return janelaPronta();
    preparada = false;
    inicioAbertura = performance.now();
    janelaPronta();
    abrirJanela();
});

// a janela só fica visível depois de já estar desenhada no início da abertura (evita ver o dashboard antigo)
function janelaPronta() {
    requestAnimationFrame(() => requestAnimationFrame(() => window.huroh?.janelaPronta?.()));
}

janelaPronta();

const esperar = ms => new Promise(resolver => setTimeout(resolver, ms));

async function abrirJanela() {
    if (!comAbertura) {
        document.body.classList.add('a-entrar');
        document.body.classList.remove('a-carregar');
        setTimeout(() => document.body.classList.remove('a-entrar'), 600);
        return;
    }

    const falta = 650 - (performance.now() - inicioAbertura);
    if (falta > 0) await esperar(falta);

    // 1. o nome sai e a casca cresce até ao tamanho da janela
    document.body.classList.add('a-abrir');
    await esperar(520);
    if (preparada) return;

    // 2. o conteúdo aparece por cima e a casca desaparece
    document.body.classList.add('a-revelar');
    document.body.classList.remove('a-carregar');
    await esperar(450);
    if (preparada) return;

    document.body.classList.remove('abertura', 'a-abrir', 'a-revelar');
}


// sessão
// ======================================================
const session = await obterSessao();

if (!session) {
    location.replace('login.html');
    await new Promise(() => {});
}

const utilizador = session.user;

supabase.auth.onAuthStateChange(evento => {
    if (evento === 'SIGNED_OUT') {
        location.replace('login.html');
    }
});

async function sair() {
    await terminarSessao();
}

document.getElementById('menu-sair').addEventListener('click', sair);
document.getElementById('ver-termos').addEventListener('click', mostrarTermos);
document.getElementById('painel-sair').addEventListener('click', sair);


// relógio e saudação
// ======================================================
function saudacao() {
    const hora = new Date().getHours();
    if (hora < 6) return 'Boa noite';
    if (hora < 13) return 'Bom dia';
    if (hora < 20) return 'Boa tarde';
    return 'Boa noite';
}

function atualizarRelogio() {
    const agora = new Date();
    const horas = agora.toLocaleTimeString(local, { hour: '2-digit', minute: '2-digit' });
    document.getElementById('relogio-topo-hora').textContent = horas;
    document.getElementById('relogio-topo-data').textContent = agora.toLocaleDateString(local, { weekday: 'short', day: 'numeric', month: 'short' });
    document.getElementById('saudacao-hora').textContent = saudacao();
    document.querySelectorAll('.rm-hora').forEach(el => { el.textContent = horas; });
    document.querySelectorAll('.rm-data').forEach(el => {
        el.textContent = agora.toLocaleDateString(local, { weekday: 'short', day: 'numeric', month: 'short' });
    });
}


// barra dos módulos
// ======================================================
document.querySelectorAll('.pagina:not(#dashboard) > .cabecalho-pagina').forEach(cabecalho => {
    const acoes = document.createElement('div');
    acoes.className = 'cabecalho-acoes';
    acoes.innerHTML = `
        <div class="relogio-topo"><strong class="rm-hora">--:--</strong><small class="rm-data"></small></div>
        <button type="button" class="botao-redondo abrir-pesquisa" aria-label="Pesquisar" title="Pesquisar (Ctrl K)">
            <svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
        </button>`;
    cabecalho.querySelectorAll(':scope > button').forEach(botao => acoes.appendChild(botao));

    const destino = cabecalho.dataset.acoesEm && cabecalho.parentElement.querySelector(cabecalho.dataset.acoesEm);
    if (destino) {
        destino.prepend(acoes);
        const ilhaAgenda = document.createElement('div');
        ilhaAgenda.className = 'ilha';
        ilhaAgenda.innerHTML = `
            <span class="ilha-icone">${icone('agenda')}</span>
            <strong>${t('Agenda')}</strong>
            <b class="ilha-valor" data-ilha="agenda"></b>`;
        destino.prepend(ilhaAgenda);
        cabecalho.remove();
        return;
    }

    const pagina = cabecalho.closest('.pagina').id;
    const titulo = cabecalho.querySelector('h1')?.textContent || '';
    const barra = document.createElement('div');
    barra.className = 'ilha-barra';
    barra.innerHTML = `
        <div class="ilha-hora"><strong class="rm-hora">--:--</strong>${icone('seta-mapa')}</div>
        <div class="ilha">
            <span class="ilha-icone">${icone(pagina)}</span>
            <strong>${titulo}</strong>
            <b class="ilha-valor" data-ilha="${pagina}"></b>
        </div>`;
    acoes.querySelector('.relogio-topo').remove();
    barra.appendChild(acoes);
    cabecalho.replaceWith(barra);
});


// barra do dashboard
// ======================================================
function montarBarraDashboard() {
    const topo = document.querySelector('.topo-barra');
    const relogio = topo.querySelector('.relogio-topo');
    const acoesTopo = topo.querySelector('.topo-acoes');
    const pesquisa = document.getElementById('pesquisa');

    const ilha = document.createElement('div');
    ilha.className = 'ilha ilha-dashboard';
    ilha.innerHTML = `
        <span class="ilha-icone">${icone('dashboard')}</span>
        <strong>${t('Dashboard')}</strong>
        <b class="ilha-valor" data-ilha="dashboard"></b>`;

    topo.prepend(relogio);
    relogio.after(ilha);
    acoesTopo.prepend(pesquisa);
}

montarBarraDashboard();


// valor da ilha
// ======================================================
const VALORES_ILHA = [
    ['financas', 'resumo-saldo-mes', ''],
    ['tarefas', 'contagem-tarefas', ''],
    ['dashboard', 'w-saldo', ' €'],
    ['agenda', 'resumo-dia-agenda', ''],
];

VALORES_ILHA.forEach(([pagina, origem, sufixo]) => {
    const fonte = document.getElementById(origem);
    const alvo = document.querySelector(`.ilha-valor[data-ilha="${pagina}"]`);
    if (!fonte || !alvo) return;

    function copiar() {
        const texto = fonte.textContent.trim();
        alvo.textContent = texto === '—' ? '' : texto + sufixo;
    }

    new MutationObserver(copiar).observe(fonte, { childList: true, characterData: true, subtree: true });
    copiar();
});


// pesquisa
// ======================================================
const campoPesquisa = document.getElementById('campo-pesquisa');

function abrirPesquisa() {
    if (document.body.dataset.pagina === 'dashboard') return;
    document.body.classList.add('pesquisa-aberta');
    setTimeout(() => campoPesquisa.focus(), 20);
}

function fecharPesquisa() {
    document.body.classList.remove('pesquisa-aberta');
}

document.addEventListener('click', evento => {
    if (evento.target.closest('.abrir-pesquisa')) {
        evento.stopPropagation();
        abrirPesquisa();
    } else if (!evento.target.closest('#pesquisa')) {
        fecharPesquisa();
    }
}, true);

document.addEventListener('keydown', evento => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') abrirPesquisa();
    if (evento.key === 'Escape') fecharPesquisa();
}, true);

document.addEventListener('navegar', fecharPesquisa);

document.getElementById('data-hoje').textContent =
    new Date().toLocaleDateString(local, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

atualizarRelogio();
setInterval(atualizarRelogio, 1000);


// menu
// ======================================================
const lateral = document.querySelector('.lateral');
let abrirMenu;
let fecharMenu;

lateral.addEventListener('pointerenter', evento => {
    if (evento.pointerType !== 'mouse') return;
    clearTimeout(fecharMenu);
    abrirMenu = setTimeout(() => lateral.classList.add('aberta'), 80);
});

lateral.addEventListener('pointerleave', () => {
    clearTimeout(abrirMenu);
    fecharMenu = setTimeout(() => lateral.classList.remove('aberta'), 200);
});

lateral.addEventListener('click', evento => {
    if (!evento.target.closest('a, button')) return;
    clearTimeout(abrirMenu);
    lateral.classList.remove('aberta');
    document.activeElement?.blur();
});

window.addEventListener('blur', () => lateral.classList.remove('aberta'));


// navegação
// ======================================================
const linksMenu = document.querySelectorAll('.lateral a[href^="#"]');
const paginas = document.querySelectorAll('.pagina');

export function mostrarPagina(id) {
    const existe = Array.from(paginas).some(pagina => pagina.id === id);

    if (!existe) {
        id = 'dashboard';
    }

    paginas.forEach(pagina => {
        pagina.classList.toggle('ativa', pagina.id === id);
    });

    linksMenu.forEach(link => {
        link.classList.toggle('ativo', !link.classList.contains('logo-marca') && link.getAttribute('href') === '#' + id);
    });

    document.body.dataset.pagina = id;
    document.body.classList.remove('pesquisa-aberta');
    history.replaceState(null, '', '#' + id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.huroh?.paginaAtual?.(id);
}

document.addEventListener('click', evento => {
    const link = evento.target.closest('a[href^="#"]');
    if (!link) return;

    evento.preventDefault();
    mostrarPagina(link.getAttribute('href').slice(1));
    document.dispatchEvent(new CustomEvent('fechar-paineis'));
});

document.addEventListener('navegar', evento => mostrarPagina(evento.detail));


// setas
// ======================================================
const ordemSeccoes = Array.from(document.querySelectorAll('.lateral .menu a[href^="#"]'))
    .map(link => link.getAttribute('href').slice(1));

document.addEventListener('keydown', evento => {
    if (evento.key !== 'ArrowUp' && evento.key !== 'ArrowDown') return;
    if (evento.ctrlKey || evento.altKey || evento.metaKey) return;
    if (evento.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (document.querySelector('dialog[open]') || document.body.classList.contains('pesquisa-aberta')) return;

    const atual = ordemSeccoes.indexOf(document.body.dataset.pagina);
    const proxima = atual + (evento.key === 'ArrowDown' ? 1 : -1);
    if (proxima < 0 || proxima >= ordemSeccoes.length) return;

    evento.preventDefault();
    mostrarPagina(ordemSeccoes[proxima]);
});

mostrarPagina(location.hash.slice(1));


// tema
// ======================================================
function aplicarTema(tema) {
    document.body.classList.toggle('tema-claro', tema === 'claro');
}

function lerTema() {
    try {
        return localStorage.getItem('tema') || 'escuro';
    } catch {
        return 'escuro';
    }
}

function mudarTema() {
    const novoTema = document.body.classList.contains('tema-claro') ? 'escuro' : 'claro';
    aplicarTema(novoTema);

    try {
        localStorage.setItem('tema', novoTema);
    } catch {}
}

document.getElementById('botao-tema').addEventListener('click', mudarTema);
document.getElementById('botao-tema-definicoes').addEventListener('click', mudarTema);

aplicarTema(lerTema());


// efeitos
// ======================================================
document.addEventListener('pointermove', evento => {
    const alvo = evento.target.closest('.widget, .cartao, .banner');
    if (!alvo) return;

    const caixa = alvo.getBoundingClientRect();
    alvo.style.setProperty('--luz-x', `${evento.clientX - caixa.left}px`);
    alvo.style.setProperty('--luz-y', `${evento.clientY - caixa.top}px`);
});

// menu lateral
// ======================================================
if (window.huroh?.desktop) {
    document.body.classList.add('desktop');
    document.body.classList.toggle('vidro', Boolean(window.huroh.vidro));

    window.huroh.aoNavegar(pagina => mostrarPagina(pagina));
    const botaoLateral = document.getElementById('botao-lateral');
    const alternarLateral = document.getElementById('alternar-lateral');

    function mostrarEstadoLateral(visivel) {
        botaoLateral.classList.toggle('ligado', visivel);
        botaoLateral.title = visivel ? 'Esconder menu lateral' : 'Mostrar menu lateral';
        alternarLateral.textContent = visivel ? 'Esconder menu lateral' : 'Mostrar menu lateral';
        document.getElementById('estado-lateral').textContent = visivel
            ? 'Ativo: aparece ao encostar o rato à esquerda do ecrã.'
            : 'Escondido. Carrega no botão para o voltar a mostrar.';
    }

    async function trocarLateral() {
        const visivel = await window.huroh.estadoLateral();
        window.huroh.mostrarLateral(!visivel);
    }

    botaoLateral.addEventListener('click', trocarLateral);
    alternarLateral.addEventListener('click', trocarLateral);
    window.huroh.aoMudarLateral(mostrarEstadoLateral);
    window.huroh.estadoLateral().then(mostrarEstadoLateral);

    window.huroh.aoAcao(acao => {
        if (acao === 'despesa') abrirMovimento(null, 'expense');
        if (acao === 'rendimento') abrirMovimento(null, 'income');
        if (acao === 'tarefa') abrirTarefa();
        if (acao === 'evento') abrirEvento();
    });
}


// arranque
// ======================================================
await abrirBd(utilizador);
if (!(await lerMeta('ultima-sincronizacao'))) await sincronizar();

await carregarPerfil(utilizador);
iniciarPerfil(utilizador);

// a janela só aparece já desenhada; as animações de entrada começam quando ela estiver à vista
function janelaVisivel() {
    if (document.visibilityState === 'visible') return Promise.resolve();
    return new Promise(resolver => {
        const pronto = () => {
            if (document.visibilityState !== 'visible') return;
            document.removeEventListener('visibilitychange', pronto);
            resolver();
        };
        document.addEventListener('visibilitychange', pronto);
        setTimeout(resolver, 1500);
    });
}

await janelaVisivel();
requestAnimationFrame(abrirJanela);

await exigirTermos(sair);

iniciarDefinicoes(utilizador, perfilAtual());
iniciarTopo();
iniciarVersao();
await iniciarCategorias();
iniciarMovimentos();
iniciarResumo();
await Promise.all([iniciarTarefas(), iniciarAgenda()]);
iniciarCalendario();
iniciarDashboard(perfilAtual);
iniciarNotificacoes();
iniciarSincronizacao(utilizador);

// o menu lateral só é criado depois das animações de entrada, para não as atrasar
setTimeout(() => window.huroh?.appPronta?.(), 900);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
