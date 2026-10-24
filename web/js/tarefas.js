import { supabase } from './supabase.js';
import { aviso, dataCurta, escapar, hora, paraInputDataHora } from './utils.js';

const PRIORIDADES = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };
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
    const lista = document.getElementById('lista-tarefas');
    const visiveis = tarefas.filter(tarefa => mostrarConcluidas || !tarefa.completed).sort(ordenar);
    const pendentes = tarefas.filter(tarefa => !tarefa.completed).length;

    document.getElementById('contagem-tarefas').textContent =
        pendentes === 1 ? '1 pendente' : `${pendentes} pendentes`;

    if (visiveis.length === 0) {
        lista.innerHTML = '<li class="vazio">Nada por fazer. Cria uma tarefa com "+ Tarefa".</li>';
        return;
    }

    lista.innerHTML = visiveis.map(tarefa => `
        <li class="lista-item tarefa ${tarefa.completed ? 'feita' : ''}">
            <input type="checkbox" class="caixa" data-concluir="${tarefa.id}" ${tarefa.completed ? 'checked' : ''}
                   aria-label="Concluir ${escapar(tarefa.title)}" />
            <div class="lista-principal">
                <p class="lista-titulo">${escapar(tarefa.title)}</p>
                <p class="lista-sub">${textoPrazo(tarefa)}</p>
            </div>
            <span class="etiqueta prioridade-${tarefa.priority}">${PRIORIDADES[tarefa.priority]}</span>
            <button type="button" class="botao-link" data-editar="${tarefa.id}">Editar</button>
        </li>
    `).join('');
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
