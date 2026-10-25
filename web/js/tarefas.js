import { supabase } from './supabase.js';
import { aviso, dataCurta, escapar, hora, paraInputDataHora } from './utils.js';

const ORDEM = { alta: 0, media: 1, baixa: 2 };

let tarefas = [];
let mostrarConcluidas = false;

export function obterTarefas() {
    return tarefas;
}


// carregar
// ======================================================
export async function carregarTarefas() {
    const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description, due_at, priority, completed, created_at')
        .order('completed')
        .order('due_at', { ascending: true, nullsFirst: false })
        .limit(300);

    if (error) {
        aviso('Não foi possível carregar as tarefas.', 'erro');
        return;
    }

    tarefas = data;
    desenharTarefas();
    document.dispatchEvent(new CustomEvent('tarefas-carregadas'));
}


// lista
// ======================================================
function ordenar(a, b) {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (ORDEM[a.priority] !== ORDEM[b.priority]) return ORDEM[a.priority] - ORDEM[b.priority];
    if (a.due_at && b.due_at) return new Date(a.due_at) - new Date(b.due_at);
    return a.due_at ? -1 : b.due_at ? 1 : 0;
}

function textoPrazo(tarefa) {
    if (!tarefa.due_at) {
        return '';
    }

    const atrasada = !tarefa.completed && new Date(tarefa.due_at) < new Date();
    const texto = `${dataCurta(tarefa.due_at)}, ${hora(tarefa.due_at)}`;
    return atrasada ? `<span class="negativo">atrasada · ${texto}</span>` : texto;
}

function desenharTarefas() {
    const pendentes = tarefas.filter(tarefa => !tarefa.completed);
    const feitas = tarefas.length - pendentes.length;
    const agora = new Date();
    const hojeTexto = agora.toDateString();
    const paraHoje = pendentes.filter(t => t.due_at && new Date(t.due_at).toDateString() === hojeTexto).sort(ordenar);
    const atrasadas = pendentes.filter(t => t.due_at && new Date(t.due_at) < agora).sort(ordenar);
    const pct = tarefas.length ? Math.round((feitas / tarefas.length) * 100) : 0;

    document.getElementById('contagem-tarefas').textContent =
        pendentes.length === 1 ? '1 pendente' : `${pendentes.length} pendentes`;
    document.getElementById('tp-feitas').textContent = feitas === 1 ? '1 concluída' : `${feitas} concluídas`;
    document.getElementById('tp-pct').textContent = `${pct}%`;
    document.getElementById('tp-anel').style.setProperty('--pct', pct);
    document.getElementById('tp-hoje').textContent = paraHoje.length;
    document.getElementById('tp-seguinte').textContent = paraHoje[0] ? `${hora(paraHoje[0].due_at)} · ${paraHoje[0].title}` : 'Nada marcado para hoje';
    document.getElementById('tp-atrasadas').textContent = atrasadas.length;
    document.getElementById('tp-atrasada-nome').textContent = atrasadas[0] ? atrasadas[0].title : 'Tudo em dia';
    document.querySelector('.tarefas-atraso').classList.toggle('com-atraso', atrasadas.length > 0);

    const visiveis = tarefas.filter(tarefa => mostrarConcluidas || !tarefa.completed).sort(ordenar);
    document.querySelectorAll('#lista-tarefas [data-coluna]').forEach(coluna => {
        const daColuna = visiveis.filter(t => t.priority === coluna.dataset.coluna);
        coluna.querySelector('[data-conta]').textContent = daColuna.filter(t => !t.completed).length;
        coluna.querySelector('ul').innerHTML = daColuna.length
            ? daColuna.map(tarefa => `
                <li class="cartao-tarefa ${tarefa.completed ? 'feita' : ''}">
                    <input type="checkbox" class="caixa" data-concluir="${tarefa.id}" ${tarefa.completed ? 'checked' : ''}
                           aria-label="Concluir ${escapar(tarefa.title)}" />
                    <div class="lista-principal" data-editar="${tarefa.id}">
                        <p class="lista-titulo" data-editar="${tarefa.id}">${escapar(tarefa.title)}</p>
                        <p class="lista-sub" data-editar="${tarefa.id}">${textoPrazo(tarefa) || 'Sem prazo'}</p>
                    </div>
                </li>`).join('')
            : '<li class="vazio">Nada aqui.</li>';
    });
}


// concluir
// ======================================================
async function alternarConcluida(id, concluida) {
    const tarefa = tarefas.find(t => t.id === id);
    tarefa.completed = concluida;
    desenharTarefas();

    const { error } = await supabase.from('tasks').update({ completed: concluida }).eq('id', id);

    if (error) {
        tarefa.completed = !concluida;
        desenharTarefas();
        aviso('Não foi possível atualizar a tarefa.', 'erro');
        return;
    }

    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: 'tasks' }));
}


// janela de criar / editar
// ======================================================
const janela = document.getElementById('janela-tarefa');
const form = document.getElementById('form-tarefa');

export function abrirTarefa(tarefa) {
    form.reset();
    form.id_tarefa.value = tarefa?.id || '';
    form.titulo.value = tarefa?.title || '';
    form.descricao.value = tarefa?.description || '';
    form.prazo.value = paraInputDataHora(tarefa?.due_at);
    form.prioridade.value = tarefa?.priority || 'media';

    document.getElementById('titulo-tarefa').textContent = tarefa ? 'Editar tarefa' : 'Nova tarefa';
    document.getElementById('apagar-tarefa').classList.toggle('escondido', !tarefa);
    janela.showModal();
    form.titulo.focus();
}

async function guardar(evento) {
    evento.preventDefault();

    const dados = {
        title: form.titulo.value.trim(),
        description: form.descricao.value.trim() || null,
        due_at: form.prazo.value ? new Date(form.prazo.value).toISOString() : null,
        priority: form.prioridade.value,
    };

    const id = form.id_tarefa.value;
    const { error } = id
        ? await supabase.from('tasks').update(dados).eq('id', id)
        : await supabase.from('tasks').insert(dados);

    if (error) {
        aviso('Não foi possível guardar a tarefa.', 'erro');
        return;
    }

    janela.close();
    aviso('Tarefa guardada.');
    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: 'tasks' }));
}

async function apagar() {
    const id = form.id_tarefa.value;

    if (!id || !confirm('Apagar esta tarefa?')) {
        return;
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
        aviso('Não foi possível apagar a tarefa.', 'erro');
        return;
    }

    janela.close();
    aviso('Tarefa apagada.');
    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: 'tasks' }));
}


// início
// ======================================================
export function iniciarTarefas() {
    document.getElementById('nova-tarefa').addEventListener('click', () => abrirTarefa());

    const lista = document.getElementById('lista-tarefas');
    lista.addEventListener('change', evento => {
        const id = evento.target.dataset.concluir;
        if (id) {
            alternarConcluida(id, evento.target.checked);
        }
    });
    lista.addEventListener('click', evento => {
        const id = evento.target.dataset.editar;
        if (id) {
            abrirTarefa(tarefas.find(tarefa => tarefa.id === id));
        }
    });

    document.getElementById('ver-concluidas').addEventListener('change', evento => {
        mostrarConcluidas = evento.target.checked;
        desenharTarefas();
    });

    form.addEventListener('submit', guardar);
    document.getElementById('apagar-tarefa').addEventListener('click', apagar);
    form.querySelector('[data-fechar]').addEventListener('click', () => janela.close());

    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'tasks') {
            carregarTarefas();
        }
    });

    return carregarTarefas();
}
