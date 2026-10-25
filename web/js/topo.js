import { local } from './idioma.js';
import { supabase } from './supabase.js';
import { dataCurta, escapar, euros, hora, intervaloDoMes } from './utils.js';
import { icone } from './icones.js';
import { obterTarefas, abrirTarefa } from './tarefas.js';
import { obterEventos, abrirEvento } from './agenda.js';
import { obterCategorias } from './categorias.js';
import { abrirMovimento } from './movimentos.js';

const CHAVE_LIDAS = 'huroh-lidas';


// painéis
// ======================================================
const paineis = {
    'botao-notificacoes': document.getElementById('painel-notificacoes'),
    'botao-perfil': document.getElementById('painel-perfil'),
};

function fecharPaineis(exceto) {
    Object.values(paineis).forEach(painel => {
        if (painel !== exceto) painel.classList.add('escondido');
    });
    if (exceto !== resultados) resultados.classList.add('escondido');
}

function ligarPaineis() {
    Object.entries(paineis).forEach(([idBotao, painel]) => {
        document.getElementById(idBotao).addEventListener('click', evento => {
            evento.stopPropagation();
            const abrir = painel.classList.contains('escondido');
            fecharPaineis(painel);
            painel.classList.toggle('escondido', !abrir);
        });
        painel.addEventListener('click', evento => {
            if (!evento.target.closest('a[href^="#"]')) evento.stopPropagation();
        });
    });

    document.addEventListener('click', () => fecharPaineis());
    document.addEventListener('fechar-paineis', () => fecharPaineis());
    document.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') fecharPaineis();
    });
}


// notificações
// ======================================================
let notificacoes = [];
let limitesPassados = [];

function lerLidas() {
    try {
        return new Set(JSON.parse(localStorage.getItem(CHAVE_LIDAS) || '[]'));
    } catch {
        return new Set();
    }
}

function guardarLidas(lidas) {
    try {
        localStorage.setItem(CHAVE_LIDAS, JSON.stringify([...lidas].slice(-300)));
    } catch {}
}

async function verificarLimites() {
    const { inicio, fim } = intervaloDoMes();
    const { data } = await supabase.rpc('despesas_por_categoria', { inicio, fim });

    limitesPassados = (data || []).filter(linha => linha.limite && Number(linha.total) > Number(linha.limite));
    calcularNotificacoes();
}

function calcularNotificacoes() {
    const agora = new Date();
    const hojeTexto = agora.toDateString();
    const amanha = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    const lista = [];

    obterTarefas().filter(t => !t.completed && t.due_at).forEach(tarefa => {
        const prazo = new Date(tarefa.due_at);

        if (prazo < agora) {
            lista.push({ id: `atrasada-${tarefa.id}`, tipo: 'erro', icone: 'aviso', titulo: `Atrasada: ${tarefa.title}`, texto: `O prazo era ${dataCurta(prazo)}, ${hora(prazo)}`, quando: prazo, abrir: () => abrirTarefa(tarefa), pagina: 'tarefas' });
        } else if (prazo.toDateString() === hojeTexto) {
            lista.push({ id: `hoje-${tarefa.id}`, tipo: 'alerta', icone: 'tarefas', titulo: `Para hoje: ${tarefa.title}`, texto: `Até às ${hora(prazo)}`, quando: prazo, abrir: () => abrirTarefa(tarefa), pagina: 'tarefas' });
        }
    });

    obterEventos().filter(e => new Date(e.start_at) >= agora && new Date(e.start_at) <= amanha).forEach(evento => {
        const inicio = new Date(evento.start_at);
        const quando = inicio.toDateString() === hojeTexto ? 'Hoje' : 'Amanhã';
        lista.push({ id: `evento-${evento.id}-${evento.start_at}`, tipo: 'info', icone: 'agenda', titulo: evento.title, texto: `${quando} às ${hora(inicio)}`, quando: inicio, abrir: () => abrirEvento(evento), pagina: 'agenda' });
    });

    limitesPassados.forEach(linha => {
        lista.push({ id: `limite-${linha.category_id}-${intervaloDoMes().inicio}`, tipo: 'erro', icone: 'financas', titulo: `Limite ultrapassado: ${linha.nome}`, texto: `${euros(linha.total)} de ${euros(linha.limite)} este mês`, quando: agora, pagina: 'financas' });
    });

    notificacoes = lista.sort((a, b) => a.quando - b.quando);
    desenharNotificacoes();
}

function desenharNotificacoes() {
    const lidas = lerLidas();
    const novas = notificacoes.filter(n => !lidas.has(n.id)).length;
    const contador = document.getElementById('contador-notificacoes');

    contador.textContent = novas > 9 ? '9+' : novas;
    contador.classList.toggle('escondido', novas === 0);

    document.getElementById('lista-notificacoes').innerHTML = notificacoes.length
        ? notificacoes.map((n, indice) => `
            <li class="notificacao ${lidas.has(n.id) ? '' : 'nova'}" data-indice="${indice}">
                <span class="notificacao-icone ${n.tipo}">${icone(n.icone)}</span>
                <div>
                    <strong>${escapar(n.titulo)}</strong>
                    <small>${escapar(n.texto)}</small>
                </div>
            </li>
        `).join('')
        : `<li class="painel-vazio">${icone('visto')}<br />Está tudo em dia.</li>`;
}

function ligarNotificacoes() {
    document.getElementById('lista-notificacoes').addEventListener('click', evento => {
        const item = evento.target.closest('[data-indice]');
        if (!item) return;

        const n = notificacoes[Number(item.dataset.indice)];
        const lidas = lerLidas();
        lidas.add(n.id);
        guardarLidas(lidas);

        fecharPaineis();
        document.dispatchEvent(new CustomEvent('navegar', { detail: n.pagina }));
        n.abrir?.();
        desenharNotificacoes();
    });

    document.getElementById('ler-tudo').addEventListener('click', () => {
        const lidas = lerLidas();
        notificacoes.forEach(n => lidas.add(n.id));
        guardarLidas(lidas);
        desenharNotificacoes();
    });

    document.addEventListener('tarefas-carregadas', calcularNotificacoes);
    document.addEventListener('eventos-carregados', calcularNotificacoes);
    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'transactions') verificarLimites();
    });
    document.addEventListener('categorias-alteradas', verificarLimites);

    setInterval(calcularNotificacoes, 60000);
    verificarLimites();
}


// pesquisa
// ======================================================
const campo = document.getElementById('campo-pesquisa');
const resultados = document.getElementById('resultados-pesquisa');
let encontrados = [];
let focado = -1;
let temporizador;

function contem(texto, termo) {
    return (texto || '').toLocaleLowerCase(local).includes(termo);
}

async function pesquisar(termo) {
    const t = termo.toLocaleLowerCase(local);

    const tarefas = obterTarefas().filter(x => contem(x.title, t) || contem(x.description, t)).slice(0, 4)
        .map(x => ({ grupo: 'Tarefas', icone: 'tarefas', titulo: x.title, texto: x.completed ? 'Concluída' : 'Por fazer', pagina: 'tarefas', abrir: () => abrirTarefa(x) }));

    const eventos = obterEventos().filter(x => contem(x.title, t) || contem(x.description, t)).slice(0, 4)
        .map(x => ({ grupo: 'Agenda', icone: 'agenda', titulo: x.title, texto: `${dataCurta(x.start_at)}, ${hora(x.start_at)}`, pagina: 'agenda', abrir: () => abrirEvento(x) }));

    const categorias = obterCategorias().filter(x => contem(x.name, t)).slice(0, 3)
        .map(x => ({ grupo: 'Categorias', icone: 'widgets', titulo: x.name, texto: x.type === 'income' ? 'Rendimento' : 'Despesa', pagina: 'financas' }));

    const seguro = termo.replace(/[%_,()]/g, ' ').trim();
    let movimentos = [];

    if (seguro) {
        const { data } = await supabase
            .from('transactions')
            .select('id, type, amount, category_id, description, transaction_date')
            .ilike('description', `%${seguro}%`)
            .order('transaction_date', { ascending: false })
            .limit(5);

        movimentos = (data || []).map(x => ({
            grupo: 'Movimentos',
            icone: x.type === 'income' ? 'entrada' : 'saida',
            titulo: x.description,
            texto: `${x.type === 'income' ? '+' : '−'} ${euros(x.amount)} · ${dataCurta(x.transaction_date)}`,
            pagina: 'financas',
            abrir: () => abrirMovimento(x),
        }));
    }

    return [...movimentos, ...tarefas, ...eventos, ...categorias];
}

function desenharResultados() {
    if (encontrados.length === 0) {
        resultados.innerHTML = '<p class="painel-vazio">Nada encontrado.</p>';
        return;
    }

    let grupo = '';
    resultados.innerHTML = encontrados.map((r, indice) => {
        const cabeca = r.grupo !== grupo ? `<p class="grupo-resultados">${r.grupo}</p>` : '';
        grupo = r.grupo;
        return `${cabeca}
            <div class="resultado ${indice === focado ? 'focado' : ''}" data-indice="${indice}">
                <span class="notificacao-icone">${icone(r.icone)}</span>
                <div>
                    <strong>${escapar(r.titulo)}</strong>
                    <small>${escapar(r.texto)}</small>
                </div>
            </div>`;
    }).join('');
}

function escolher(indice) {
    const r = encontrados[indice];
    if (!r) return;

    campo.value = '';
    campo.blur();
    fecharPaineis();
    document.dispatchEvent(new CustomEvent('navegar', { detail: r.pagina }));
    r.abrir?.();
}

function ligarPesquisa() {
    campo.addEventListener('input', () => {
        clearTimeout(temporizador);
        const termo = campo.value.trim();

        if (termo.length < 2) {
            resultados.classList.add('escondido');
            return;
        }

        temporizador = setTimeout(async () => {
            encontrados = await pesquisar(termo);
            focado = -1;
            fecharPaineis(resultados);
            resultados.classList.remove('escondido');
            desenharResultados();
        }, 200);
    });

    campo.addEventListener('keydown', evento => {
        if (resultados.classList.contains('escondido')) return;

        if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
            evento.preventDefault();
            const passo = evento.key === 'ArrowDown' ? 1 : -1;
            focado = (focado + passo + encontrados.length) % encontrados.length;
            desenharResultados();
        }

        if (evento.key === 'Enter') {
            escolher(focado >= 0 ? focado : 0);
        }
    });

    resultados.addEventListener('click', evento => {
        evento.stopPropagation();
        const item = evento.target.closest('[data-indice]');
        if (item) escolher(Number(item.dataset.indice));
    });

    campo.addEventListener('click', evento => evento.stopPropagation());

    const pesquisa = document.getElementById('pesquisa');

    pesquisa.addEventListener('click', () => {
        if (!pesquisa.classList.contains('aberta')) {
            pesquisa.classList.add('aberta');
            campo.focus();
        }
    });

    campo.addEventListener('focus', () => pesquisa.classList.add('aberta'));

    campo.addEventListener('blur', () => {
        setTimeout(() => {
            if (!campo.value && !pesquisa.contains(document.activeElement)) pesquisa.classList.remove('aberta');
        }, 200);
    });

    document.addEventListener('keydown', evento => {
        if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
            evento.preventDefault();
            campo.focus();
        }
    });
}


// início
// ======================================================
export function iniciarTopo() {
    ligarPaineis();
    ligarNotificacoes();
    ligarPesquisa();
}
