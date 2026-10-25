import { local } from './idioma.js';
import { supabase } from './supabase.js';
import { dataISO, escapar, euros, hora, intervaloDoMes } from './utils.js';

const huroh = window.huroh || {};
const corpo = document.body;
let ratoAtivo = false;
let fecharDepois;
let expandirDepois;


// abrir e fechar
// ======================================================
function definirRato(ativo) {
    if (ativo === ratoAtivo) return;
    ratoAtivo = ativo;
    huroh.ratoAtivo?.(ativo);
}

function abrir() {
    clearTimeout(fecharDepois);
    if (!corpo.classList.contains('aberto')) {
        corpo.classList.add('aberto');
        atualizarTudo();
    }
}

function expandir() {
    clearTimeout(fecharDepois);
    corpo.classList.add('aberto', 'expandido');
}

function fechar() {
    clearTimeout(expandirDepois);
    corpo.classList.remove('expandido', 'aberto');
    definirRato(false);
}

function agendarFecho() {
    clearTimeout(expandirDepois);
    clearTimeout(fecharDepois);
    fecharDepois = setTimeout(fechar, 450);
}

document.addEventListener('mousemove', evento => {
    const alvo = document.elementFromPoint(evento.clientX, evento.clientY);
    const dentro = Boolean(alvo?.closest('.zona, .gatilho'));
    definirRato(dentro);

    if (!dentro && corpo.classList.contains('aberto')) agendarFecho();
    if (dentro) clearTimeout(fecharDepois);
});

document.getElementById('gatilho').addEventListener('mouseenter', abrir);

document.querySelector('.trilho').addEventListener('mouseenter', () => {
    abrir();
    clearTimeout(expandirDepois);
    expandirDepois = setTimeout(expandir, 280);
});

document.addEventListener('mouseleave', agendarFecho);

document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') fechar();
});


// cliques
// ======================================================
document.addEventListener('click', evento => {
    const pagina = evento.target.closest('[data-pagina]');
    const acao = evento.target.closest('[data-acao]');

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

async function carregarPerfil() {
    const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', sessao.user.id)
        .single();

    const nome = data?.display_name || sessao.user.email.split('@')[0];
    const foto = data?.avatar_url || avatarIniciais(nome);

    document.getElementById('perfil-nome').textContent = nome;
    document.getElementById('perfil-email').textContent = sessao.user.email;
    document.getElementById('avatar-painel').src = foto;
    document.getElementById('avatar-trilho').src = foto;
}

async function carregarSaldo() {
    const { inicio, fim } = intervaloDoMes();
    const trintaDias = new Date();
    trintaDias.setDate(trintaDias.getDate() - 29);

    const [total, mes, movimentos] = await Promise.all([
        supabase.rpc('resumo_financeiro').single(),
        supabase.rpc('resumo_financeiro', { inicio, fim }).single(),
        supabase.from('transactions').select('type, amount, transaction_date').gte('transaction_date', dataISO(trintaDias)),
    ]);

    if (total.error) return;

    const saldo = Number(total.data.saldo);
    const saldoMes = Number(mes.data?.saldo || 0);
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
    (movimentos.data || []).forEach(m => {
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
    const { data } = await supabase.from('tasks').select('title, priority, completed, due_at').limit(300);
    const tarefas = data || [];
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
    const { data } = await supabase
        .from('events')
        .select('title, start_at, end_at')
        .gte('start_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order('start_at')
        .limit(5);

    const agora = new Date();
    const proximo = (data || []).find(e => new Date(e.end_at || e.start_at) >= agora);

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
const { data } = await supabase.auth.getSession();
sessao = data.session;

if (!sessao) {
    document.getElementById('avatar-trilho').src = avatarIniciais('H');
    document.getElementById('avatar-painel').src = avatarIniciais('H');
} else {
    await carregarPerfil();
    await atualizarTudo(true);

    supabase.channel('lateral-' + sessao.user.id)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${sessao.user.id}` }, () => atualizarTudo(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${sessao.user.id}` }, () => atualizarTudo(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `user_id=eq.${sessao.user.id}` }, () => atualizarTudo(true))
        .subscribe();

    setInterval(() => atualizarTudo(true), 60000);
}

window.addEventListener('storage', evento => {
    if (evento.key === 'perfil-atualizado' && sessao) carregarPerfil();
});

supabase.auth.onAuthStateChange((_evento, novaSessao) => {
    if (Boolean(novaSessao) !== Boolean(sessao)) location.reload();
});
