import { obterEventos } from './agenda.js';
import { obterTarefas } from './tarefas.js';
import { hora } from './utils.js';

const CHAVE = 'huroh-notificados';
const JANELA = 10 * 60 * 1000;

function lerNotificados() {
    try {
        return new Set(JSON.parse(localStorage.getItem(CHAVE) || '[]'));
    } catch {
        return new Set();
    }
}

function guardarNotificados(notificados) {
    try {
        localStorage.setItem(CHAVE, JSON.stringify([...notificados].slice(-200)));
    } catch {}
}

function permitido() {
    return 'Notification' in window && Notification.permission === 'granted';
}


// verificar
// ======================================================
function verificar() {
    if (!permitido()) return;

    const agora = Date.now();
    const notificados = lerNotificados();

    obterEventos().forEach(evento => {
        if (!evento.reminder_at) return;

        const momento = new Date(evento.reminder_at).getTime();
        const chave = `e-${evento.id}-${evento.reminder_at}`;

        if (momento <= agora && agora - momento < JANELA && !notificados.has(chave)) {
            new Notification(evento.title, { body: `Às ${hora(evento.start_at)}`, tag: chave });
            notificados.add(chave);
        }
    });

    obterTarefas().forEach(tarefa => {
        if (tarefa.completed || !tarefa.due_at) return;

        const momento = new Date(tarefa.due_at).getTime();
        const chave = `t-${tarefa.id}-${tarefa.due_at}`;

        if (momento <= agora && agora - momento < JANELA && !notificados.has(chave)) {
            new Notification(`Prazo: ${tarefa.title}`, { body: 'Esta tarefa chegou ao prazo.', tag: chave });
            notificados.add(chave);
        }
    });

    guardarNotificados(notificados);
}


// botão
// ======================================================
function atualizarEstado() {
    const estado = document.getElementById('estado-notificacoes');
    const botao = document.getElementById('ativar-notificacoes');

    if (!('Notification' in window)) {
        estado.textContent = 'Este navegador não suporta notificações.';
        botao.classList.add('escondido');
        return;
    }

    const textos = {
        granted: 'Ativas. Recebes avisos de eventos e prazos enquanto o HUROH estiver aberto.',
        denied: 'Bloqueadas no navegador. Para ativar, muda a permissão nas definições do site.',
        default: 'Desativadas.',
    };

    estado.textContent = textos[Notification.permission];
    botao.classList.toggle('escondido', Notification.permission !== 'default');
}

export function iniciarNotificacoes() {
    document.getElementById('ativar-notificacoes').addEventListener('click', async () => {
        await Notification.requestPermission();
        atualizarEstado();
        verificar();
    });

    atualizarEstado();
    verificar();
    setInterval(verificar, 30000);
}
