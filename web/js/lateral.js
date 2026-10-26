import { local } from './idioma.js';
import { obterSessao, supabase } from './supabase.js';
import * as bd from './bd.js';
import { dataISO, escapar, euros, hora, intervaloDoMes } from './utils.js';

const huroh = window.huroh || {};
const corpo = document.body;
let ratoAtivo = false;
let fecharDepois;
let expandirDepois;
let mostrarAte = 0;


// abrir e fechar
// ======================================================
function definirRato(ativo) {
    if (ativo === ratoAtivo) return;
    ratoAtivo = ativo;
    huroh.ratoAtivo?.(ativo);
}

function abrir() {
    if (!corpo.classList.contains('aberto')) {
        corpo.classList.add('aberto');
        atualizarTudo();
    }
}

function expandir() {
    expandirDepois = null;
    corpo.classList.add('aberto', 'expandido');
}

function fechar() {
    clearTimeout(expandirDepois);
    expandirDepois = null;
    clearTimeout(fecharDepois);
    fecharDepois = null;
    corpo.classList.remove('expandido', 'aberto');
    definirRato(false);
}

function agendarFecho() {
    clearTimeout(expandirDepois);
    expandirDepois = null;
    if (!fecharDepois) fecharDepois = setTimeout(fechar, 450);
}

// a posição do rato chega pelo Electron (e pelo mousemove, quando o Windows o entrega)
function verPonto(ponto) {
    const alvo = ponto && document.elementFromPoint(ponto.x, ponto.y);
    const zona = alvo?.closest('.zona, .gatilho');
    definirRato(Boolean(zona));

    if (!zona) {
        if (corpo.classList.contains('aberto') && Date.now() > mostrarAte) agendarFecho();
        return;
    }

    clearTimeout(fecharDepois);
    fecharDepois = null;
    abrir();

    if (zona.classList.contains('trilho') && !corpo.classList.contains('expandido') && !expandirDepois) {
        expandirDepois = setTimeout(expandir, 220);
    } else if (!zona.classList.contains('trilho')) {
        clearTimeout(expandirDepois);
        expandirDepois = null;
    }
}

document.addEventListener('mousemove', evento => verPonto({ x: evento.clientX, y: evento.clientY }));
huroh.aoRato?.(verPonto);

document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') fechar();
});

// entrada: uma gota com brilho sai da janela principal e abre-se no trilho
// ======================================================
const DURACAO_GOTA = 1000;

function mostrarTrilhoAberto() {
    mostrarAte = Date.now() + 1800;
    corpo.classList.add('chegada');
    abrir();
    setTimeout(() => corpo.classList.remove('chegada'), 500);
    setTimeout(() => {
        if (!ratoAtivo) fechar();
    }, 1800);
}

function apresentar(origem) {
    const trilho = document.querySelector('.trilho');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !trilho) return mostrarTrilhoAberto();

    document.querySelector('.gota')?.remove();
    const gota = document.createElement('div');
    gota.className = 'gota';
    corpo.appendChild(gota);

    const altura = trilho.offsetHeight;
    const topo = (innerHeight - altura) / 2;
    const meio = innerHeight / 2;
    const x = Math.min(Math.max(origem?.x ?? innerWidth, 90), innerWidth - 24);
    const y = Math.min(Math.max(origem?.y ?? meio, 60), innerHeight - 60);

    const posicao = (cx, cy, largura, alto) => ({
        left: `${cx - largura / 2}px`,
        top: `${cy - alto / 2}px`,
        width: `${largura}px`,
        height: `${alto}px`,
    });

    const animacao = gota.animate([
        { ...posicao(x, y, 44, 44), opacity: 0, transform: 'scale(0.3)', offset: 0 },
        { ...posicao(x - 6, y, 46, 46), opacity: 1, transform: 'scale(1)', offset: 0.18 },
        { ...posicao((x + 40) / 2, (y + meio) / 2, 66, 42), opacity: 1, transform: 'scale(1)', offset: 0.42 },
        { ...posicao(40, meio, 60, 60), opacity: 1, transform: 'scale(1)', offset: 0.66 },
        { ...posicao(40, topo + altura / 2, 60, altura), opacity: 1, transform: 'scale(1)', offset: 1 },
    ], { duration: DURACAO_GOTA, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' });

    animacao.finished.then(() => {
        mostrarTrilhoAberto();
        gota.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-out', fill: 'forwards' })
            .finished.then(() => gota.remove());
    }).catch(() => gota.remove());
}

huroh.aoApresentar?.(apresentar);


// cliques
// ======================================================
document.addEventListener('click', evento => {
    const pagina = evento.target.closest('[data-pagina]');
    const acao = evento.target.closest('[data-acao]');

    // o X só recolhe os menus; o botão de sair do trilho é que esconde o menu lateral
    if (evento.target.closest('[data-fechar]')) {
        fechar();
        return;
    }

    if (evento.target.closest('[data-esconder]')) {
        fechar();
        huroh.esconderLateral?.();
        return;
    }

    if (evento.target.closest('[data-widgets]')) {
        huroh.abrir?.('dashboard');
        fechar();
        return;
    }

    if (acao) {
        huroh.abrir?.(acao.dataset.destino || 'dashboard', acao.dataset.acao);
        fechar();
        return;
    }

    if (pagina) {
        huroh.abrir?.(pagina.dataset.pagina);
        marcarPagina(pagina.dataset.pagina);
        fechar();
    }
});

function marcarPagina(pagina) {
    document.querySelectorAll('[data-pagina]').forEach(item => {
        item.classList.toggle('ativo', item.dataset.pagina === pagina &&
            (item.classList.contains('trilho-item') || item.classList.contains('painel-item')));
    });
}

huroh.aoMudarPagina?.(marcarPagina);
marcarPagina('dashboard');


// tema
// ======================================================
function aplicarTema() {
    let tema = 'escuro';
    try {
        tema = localStorage.getItem('tema') || 'escuro';
    } catch {}
    corpo.classList.toggle('tema-claro', tema === 'claro');
}

aplicarTema();
window.addEventListener('storage', evento => {
    if (evento.key === 'tema') aplicarTema();
});


// relógio
// ======================================================
function relogio() {
    const agora = new Date();
    document.getElementById('painel-hora').textContent = hora(agora);
    document.getElementById('painel-data').textContent =
        agora.toLocaleDateString(local, { weekday: 'long', day: 'numeric', month: 'long' });
}

relogio();
setInterval(relogio, 15000);


// conta
// ======================================================
let sessao = null;

function avatarIniciais(nome) {
    const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || 'H';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#16161b"/><text x="40" y="50" font-family="Inter, sans-serif" font-size="30" font-weight="800" fill="#f4f4f5" text-anchor="middle">${escapar(iniciais)}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function carregarPerfil() {
    let guardado = null;
    try {
        guardado = JSON.parse(localStorage.getItem('perfil-' + sessao.user.id));
    } catch {}

    const nome = guardado?.nome || sessao.user.email.split('@')[0];
    const foto = guardado?.avatar || avatarIniciais(nome);

    document.getElementById('perfil-nome').textContent = nome;
    document.getElementById('perfil-email').textContent = sessao.user.email;
    document.getElementById('avatar-painel').src = foto;
    document.getElementById('avatar-trilho').src = foto;
}

async function carregarSaldo() {
    const { inicio, fim } = intervaloDoMes();
    const trintaDias = new Date();
    trintaDias.setDate(trintaDias.getDate() - 29);

    const [total, mes, todos] = await Promise.all([
        bd.resumoFinanceiro(),
        bd.resumoFinanceiro(inicio, fim),
        bd.listar('transactions'),
    ]);

    const saldo = total.saldo;
    const saldoMes = mes.saldo;
    const desde = dataISO(trintaDias);
    const movimentos = todos.filter(m => m.transaction_date >= desde);
    const valor = document.getElementById('saldo-valor');
    valor.textContent = euros(saldo);
    valor.classList.toggle('negativo', saldo < 0);

    const canto = document.getElementById('saldo-mes');
    canto.textContent = `${saldoMes < 0 ? '−' : '+'}${euros(Math.abs(saldoMes))}`;
    canto.className = `pilula-canto ${saldoMes < 0 ? 'negativo' : 'positivo'}`;

    const dias = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(trintaDias);
        d.setDate(d.getDate() + i);
        return { chave: dataISO(d), variacao: 0 };
    });
    movimentos.forEach(m => {
        const dia = dias.find(d => d.chave === m.transaction_date);
        if (dia) dia.variacao += (m.type === 'income' ? 1 : -1) * Math.round(Number(m.amount) * 100);
    });

    let acumulado = Math.round(saldo * 100) - dias.reduce((s, d) => s + d.variacao, 0);
    const pontos = dias.map(d => (acumulado += d.variacao));
    desenharLinha(pontos);
}

function desenharLinha(pontos) {
    const menor = Math.min(...pontos);
    const maior = Math.max(...pontos);
    const amplitude = maior - menor || 1;
    const coords = pontos.map((v, i) => [
        (i / (pontos.length - 1)) * 300,
        52 - ((v - menor) / amplitude) * 40,
    ]);
    const linha = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    document.getElementById('linha-saldo').innerHTML = `
        <defs>
            <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#3df2a0" stop-opacity="0.45" />
                <stop offset="1" stop-color="#3df2a0" stop-opacity="0" />
            </linearGradient>
        </defs>
        <path d="${linha} L300,60 L0,60 Z" fill="url(#area)" />
        <path d="${linha}" fill="none" stroke="#3df2a0" stroke-width="2" vector-effect="non-scaling-stroke" />
    `;
}

async function carregarTarefas() {
    const tarefas = await bd.listar('tasks');
    const pendentes = tarefas.filter(t => !t.completed);
    const feitas = tarefas.length - pendentes.length;
    const pct = tarefas.length ? Math.round((feitas / tarefas.length) * 100) : 0;
    const proxima = pendentes.find(t => t.priority === 'alta') || pendentes[0];
    const atrasadas = pendentes.filter(t => t.due_at && new Date(t.due_at) < new Date()).length;

    document.getElementById('tarefas-anel').style.setProperty('--pct', pct);
    document.getElementById('tarefas-pct').textContent = `${pct}%`;
    document.getElementById('tarefa-proxima').textContent =
        proxima ? proxima.title : tarefas.length ? 'Tudo feito' : 'Sem tarefas';

    document.getElementById('alertas-ponto').classList.toggle('escondido', atrasadas === 0);
    document.getElementById('alertas-texto').textContent = atrasadas
        ? `${atrasadas} ${atrasadas === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}`
        : 'Tudo em dia';
}

async function carregarEvento() {
    const agora = new Date();
    const proximo = (await bd.listar('events'))
        .sort((a, b) => new Date(a.start_at) - new Date(b.start_at))
        .find(e => new Date(e.end_at || e.start_at) >= agora);

    if (!proximo) {
        document.getElementById('evento-quando').textContent = 'AGENDA';
        document.getElementById('evento-titulo').textContent = 'Sem eventos';
        document.getElementById('evento-hora').textContent = '';
        return;
    }

    const inicio = new Date(proximo.start_at);
    const hoje = inicio.toDateString() === agora.toDateString();
    document.getElementById('evento-quando').textContent = hoje
        ? 'HOJE'
        : inicio.toLocaleDateString(local, { weekday: 'short', day: 'numeric' }).toUpperCase();
    document.getElementById('evento-titulo').textContent = proximo.title;
    document.getElementById('evento-hora').textContent = hora(inicio);
}

let ultimaAtualizacao = 0;

async function atualizarTudo(forcar = false) {
    if (!sessao) return;
    if (!forcar && Date.now() - ultimaAtualizacao < 15000) return;
    ultimaAtualizacao = Date.now();

    await Promise.all([carregarSaldo(), carregarTarefas(), carregarEvento()]);
}


// início
// ======================================================
sessao = await obterSessao();

if (!sessao) {
    document.getElementById('avatar-trilho').src = avatarIniciais('H');
    document.getElementById('avatar-painel').src = avatarIniciais('H');
} else {
    await bd.abrirBd(sessao.user);
    carregarPerfil();
    await atualizarTudo(true);

    // a janela principal grava os dados; aqui só se lê
    document.addEventListener('dados-alterados', () => atualizarTudo(true));
    setInterval(() => atualizarTudo(true), 60000);
}

window.addEventListener('storage', evento => {
    if (evento.key === 'perfil-atualizado' && sessao) carregarPerfil();
});

supabase.auth.onAuthStateChange((_evento, novaSessao) => {
    if (Boolean(novaSessao) !== Boolean(sessao)) location.reload();
});
