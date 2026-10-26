import { local, t } from './idioma.js';
import * as bd from './bd.js';
import { dataCurta, escapar, euros, hora, intervaloDoMes } from './utils.js';
import { icone } from './icones.js';
import { abrirMovimento } from './movimentos.js';
import { abrirEvento, obterEventos, proximosEventos } from './agenda.js';
import { obterTarefas } from './tarefas.js';
import { categoriaPorId } from './categorias.js';

const estado = { saldo: 0, despesasMes: 0, rendimentosMes: 0 };
const movimentosRecentes = new Map();

function definir(id, valor) {
    document.getElementById(id).textContent = valor;
}

function animarEuros(elemento, valor, semMoeda = false) {
    const inicio = Number(elemento.dataset.valor || 0);
    const comeco = performance.now();
    elemento.dataset.valor = valor;

    function passo(agora) {
        const t = Math.min(1, (agora - comeco) / 900);
        const suave = 1 - Math.pow(1 - t, 3);
        const texto = euros(inicio + (valor - inicio) * suave);
        elemento.textContent = semMoeda ? texto.replace(/\s?€\s?/, '') : texto;
        if (t < 1) requestAnimationFrame(passo);
    }

    requestAnimationFrame(passo);
}

function plural(n, um, varios) {
    return `${n} ${t(n === 1 ? um : varios)}`;
}


// saudação
// ======================================================
function atualizarBanner() {
    const hoje = new Date().toDateString();
    const pendentes = obterTarefas().filter(t => !t.completed);
    const tarefasHoje = pendentes.filter(t => t.due_at && new Date(t.due_at).toDateString() === hoje).length;
    const eventosHoje = obterEventos().filter(e => new Date(e.start_at).toDateString() === hoje).length;

    const partes = [];
    if (tarefasHoje) partes.push(`<strong>${plural(tarefasHoje, 'tarefa', 'tarefas')}</strong> ${t('para hoje')}`);
    if (eventosHoje) partes.push(`<strong>${plural(eventosHoje, 'evento', 'eventos')}</strong> ${t('na agenda')}`);

    let texto = partes.length ? `${t('Tens')} ${partes.join(` ${t('e')} `)}.` : t('Dia livre: não tens nada marcado para hoje.');
    texto += estado.despesasMes > 0
        ? ` ${t('Este mês já saíram')} <strong>${euros(estado.despesasMes)}</strong>.`
        : ' ' + t('Ainda não registaste despesas este mês.');

    document.getElementById('resumo-dia').innerHTML = texto;
}


// finanças
// ======================================================
async function atualizarFinancas() {
    const { inicio, fim } = intervaloDoMes();

    const [total, mes] = await Promise.all([bd.resumoFinanceiro(), bd.resumoFinanceiro(inicio, fim)]);

    estado.saldo = total.saldo;
    estado.despesasMes = mes.despesas;
    estado.rendimentosMes = mes.rendimentos;
    const saldoMes = mes.saldo;

    const valorSaldo = document.getElementById('w-saldo');
    animarEuros(valorSaldo, estado.saldo, true);
    valorSaldo.classList.toggle('negativo', estado.saldo < 0);

    definir('w-saldo-estado', t(estado.saldo < 0 ? 'Negativo' : 'Positivo'));
    document.getElementById('w-saldo-detalhe').textContent =
        `${saldoMes < 0 ? '−' : '+'}${euros(Math.abs(saldoMes))} ${t('este mês')}`;

    const gasto = estado.rendimentosMes > 0 ? Math.min(1, estado.despesasMes / estado.rendimentosMes) : (estado.despesasMes > 0 ? 1 : 0);
    document.getElementById('w-saldo-linha').style.width = `${Math.round(gasto * 100)}%`;

    const nomeMes = new Date().toLocaleDateString(local, { month: 'long' });
    definir('w-mes-nome', nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1));
    animarEuros(document.getElementById('w-rendimentos'), estado.rendimentosMes);
    animarEuros(document.getElementById('w-despesas'), estado.despesasMes);
    definir('w-mes-texto', `${saldoMes < 0 ? '−' : ''}${euros(Math.abs(saldoMes))}`);
    const sobra = estado.rendimentosMes > 0 ? Math.max(0, Math.round((saldoMes / estado.rendimentosMes) * 100)) : 0;
    definir('w-mes-pct', `${sobra}%`);
    document.getElementById('w-mes-barra').style.width = `${Math.min(100, sobra)}%`;
    atualizarBanner();
}


// recentes
// ======================================================
async function atualizarRecentes() {
    const data = (await bd.listar('transactions'))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 5);

    movimentosRecentes.clear();
    (data || []).forEach(m => movimentosRecentes.set(m.id, m));

    const movimentos = (data || []).map(m => {
        const categoria = categoriaPorId(m.category_id);
        const entrada = m.type === 'income';
        return {
            quando: m.created_at,
            html: `
                <li class="lista-item recente" data-movimento="${m.id}">
                    <span class="icone-item ${entrada ? 'ok' : 'erro'}">${icone(entrada ? 'entrada' : 'saida')}</span>
                    <div class="lista-principal">
                        <p class="lista-titulo">${escapar(m.description || categoria?.name || 'Movimento')}</p>
                        <p class="lista-sub">${escapar(categoria?.name || 'Sem categoria')} · ${dataCurta(m.transaction_date)}</p>
                    </div>
                    <span class="lista-valor ${entrada ? 'positivo' : 'negativo'}">${entrada ? '+' : '−'}${euros(m.amount)}</span>
                </li>`,
        };
    });

    const tarefas = obterTarefas().slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3).map(t => ({
        quando: t.created_at,
        html: `
            <li class="lista-item">
                <span class="icone-item ${t.completed ? 'ok' : 'info'}">${icone(t.completed ? 'visto' : 'tarefas')}</span>
                <div class="lista-principal">
                    <p class="lista-titulo">${escapar(t.title)}</p>
                    <p class="lista-sub">${t.completed ? 'Tarefa concluída' : 'Nova tarefa'} · ${dataCurta(t.created_at)}</p>
                </div>
            </li>`,
    }));

    const todos = [...movimentos, ...tarefas].sort((a, b) => new Date(b.quando) - new Date(a.quando)).slice(0, 3);

    const lista = document.getElementById('w-recentes');
    if (!lista) return;
    lista.innerHTML = todos.length
        ? todos.map(t => t.html).join('')
        : '<li class="vazio">Ainda não há atividade. Regista um movimento para começar.</li>';
}


// eventos
// ======================================================
function atualizarSemana() {
    const hoje = new Date();
    const doDia = obterEventos().filter(e => new Date(e.start_at).toDateString() === hoje.toDateString()).length;
    const mes = hoje.toLocaleDateString(local, { month: 'short' }).replace('.', '');

    definir('w-dia-data', `${hoje.getDate()} ${mes.charAt(0).toUpperCase()}${mes.slice(1)}`);
    definir('w-dia-semana', hoje.toLocaleDateString(local, { weekday: 'long' }).replace(/^./, c => c.toUpperCase()));
    definir('w-dia-total', plural(doDia, 'evento', 'eventos'));

    const proximos = proximosEventos(3);
    document.getElementById('w-proximos').innerHTML = proximos.length
        ? proximos.map(e => {
            const inicio = new Date(e.start_at);
            const quando = inicio.toDateString() === hoje.toDateString()
                ? `${hora(e.start_at)}${e.end_at ? ' - ' + hora(e.end_at) : ''}`
                : `${dataCurta(e.start_at)} · ${hora(e.start_at)}`;
            return `
                <li data-editar-evento="${e.id}">
                    <p>${escapar(e.title)}</p>
                    <small>${quando}</small>
                </li>`;
        }).join('')
        : '<li class="vazio">Sem eventos marcados.</li>';
}


// cartão
// ======================================================
function ligarCartao() {
    const cartao = document.getElementById('cartao-credito');
    if (!cartao) return;

    cartao.addEventListener('pointermove', evento => {
        const caixa = cartao.getBoundingClientRect();
        const x = (evento.clientX - caixa.left) / caixa.width;
        const y = (evento.clientY - caixa.top) / caixa.height;
        cartao.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 16}deg)`;
        cartao.style.setProperty('--brilho-x', `${x * 100}%`);
    });

    cartao.addEventListener('pointerleave', () => {
        cartao.style.transform = '';
        cartao.style.setProperty('--brilho-x', '50%');
    });
}


// início
// ======================================================
export function iniciarDashboard() {
    ligarCartao();

    document.getElementById('w-novo-evento').addEventListener('click', () => abrirEvento());

    document.addEventListener('click', evento => {
        const rapido = evento.target.closest('[data-rapido]');
        if (rapido) abrirMovimento(null, rapido.dataset.rapido);

        const recente = evento.target.closest('[data-movimento]');
        if (recente) abrirMovimento(movimentosRecentes.get(recente.dataset.movimento));
    });

    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'transactions') {
            atualizarFinancas();
            atualizarRecentes();
        }
    });
    document.addEventListener('categorias-alteradas', atualizarRecentes);
    document.addEventListener('eventos-carregados', () => {
        atualizarSemana();
        atualizarBanner();
    });
    document.addEventListener('tarefas-carregadas', () => {
        atualizarRecentes();
        atualizarBanner();
    });

    setInterval(atualizarSemana, 60000);

    atualizarFinancas();
    atualizarRecentes();
    atualizarSemana();
}
