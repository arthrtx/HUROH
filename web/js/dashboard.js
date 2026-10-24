import { supabase } from './supabase.js';
import { dataCurta, escapar, euros, hora, intervaloDoMes } from './utils.js';
import { abrirMovimento } from './movimentos.js';
import { obterEventos, proximosEventos } from './agenda.js';
import { obterTarefas } from './tarefas.js';

function texto(id, valor) {
    document.getElementById(id).textContent = valor;
}


// saldo e despesas
// ======================================================
async function atualizarFinancas() {
    const { inicio, fim } = intervaloDoMes();

    const [total, mes] = await Promise.all([
        supabase.rpc('resumo_financeiro').single(),
        supabase.rpc('resumo_financeiro', { inicio, fim }).single(),
    ]);

    if (total.error || mes.error) {
        return;
    }

    const saldo = Number(total.data.saldo);
    const saldoMes = Number(mes.data.saldo);
    const valorSaldo = document.getElementById('w-saldo');
    valorSaldo.textContent = euros(saldo);
    valorSaldo.classList.toggle('negativo', saldo < 0);

    document.getElementById('w-saldo-detalhe').innerHTML =
        `<span class="${saldoMes < 0 ? 'negativo' : 'positivo'}">${saldoMes < 0 ? '−' : '+'} ${euros(Math.abs(saldoMes))}</span> este mês`;

    texto('w-despesas', euros(mes.data.despesas));
    texto('w-despesas-detalhe', `Rendimentos: ${euros(mes.data.rendimentos)}`);
}


// agenda e tarefas
// ======================================================
function atualizarAgenda() {
    const [proximo] = proximosEventos(1);

    if (!proximo) {
        texto('w-evento-hora', '—');
        texto('w-evento', 'Sem eventos marcados');
        return;
    }

    const hoje = new Date().toDateString() === new Date(proximo.start_at).toDateString();
    texto('w-evento-hora', hora(proximo.start_at));
    texto('w-evento', `${hoje ? 'Hoje' : dataCurta(proximo.start_at)} · ${proximo.title}`);
}

function atualizarTarefas() {
    const pendentes = obterTarefas().filter(tarefa => !tarefa.completed);
    const urgente = pendentes.find(tarefa => tarefa.priority === 'alta') || pendentes[0];

    texto('w-tarefas', pendentes.length);
    texto('w-tarefa', urgente ? urgente.title : 'Nada pendente');
}


// lembretes: eventos com lembrete e tarefas com prazo nos próximos 3 dias
// ======================================================
export function lembretesProximos() {
    const agora = new Date();
    const limite = new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000);

    const deEventos = obterEventos()
        .filter(evento => evento.reminder_at && new Date(evento.start_at) >= agora && new Date(evento.start_at) <= limite)
        .map(evento => ({ quando: evento.start_at, texto: evento.title }));

    const deTarefas = obterTarefas()
        .filter(tarefa => !tarefa.completed && tarefa.due_at && new Date(tarefa.due_at) <= limite)
        .map(tarefa => ({ quando: tarefa.due_at, texto: tarefa.title, atrasada: new Date(tarefa.due_at) < agora }));

    return [...deTarefas, ...deEventos].sort((a, b) => new Date(a.quando) - new Date(b.quando));
}

function atualizarLembretes() {
    const lembretes = lembretesProximos();
    texto('w-lembretes', lembretes.length);

    document.getElementById('w-lembretes-lista').innerHTML = lembretes.slice(0, 3).map(lembrete => `
        <li class="${lembrete.atrasada ? 'negativo' : ''}">
            ${escapar(lembrete.texto)} <span>· ${dataCurta(lembrete.quando)} ${hora(lembrete.quando)}</span>
        </li>
    `).join('') || '<li>Sem lembretes próximos</li>';
}


// início
// ======================================================
export function iniciarDashboard() {
    document.getElementById('grelha-dashboard').addEventListener('click', evento => {
        const tipo = evento.target.dataset.rapido;
        if (tipo) {
            abrirMovimento(null, tipo);
        }
    });

    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'transactions') atualizarFinancas();
    });
    document.addEventListener('eventos-carregados', () => {
        atualizarAgenda();
        atualizarLembretes();
    });
    document.addEventListener('tarefas-carregadas', () => {
        atualizarTarefas();
        atualizarLembretes();
    });

    setInterval(() => {
        atualizarAgenda();
        atualizarLembretes();
    }, 60000);

    atualizarFinancas();
    atualizarAgenda();
    atualizarTarefas();
    atualizarLembretes();
}
