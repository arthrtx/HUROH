import { local } from './idioma.js';
import { supabase } from './supabase.js';
import { aviso, escapar, hora, paraInputDataHora } from './utils.js';

let eventos = [];

export function obterEventos() {
    return eventos;
}


// carregar
// ======================================================
export async function carregarEventos() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fim = new Date(hoje.getFullYear() + 1, hoje.getMonth(), 1);

    const { data, error } = await supabase
        .from('events')
        .select('id, title, description, start_at, end_at, reminder_at')
        .gte('start_at', inicio.toISOString())
        .lt('start_at', fim.toISOString())
        .order('start_at');

    if (error) {
        aviso('Não foi possível carregar a agenda.', 'erro');
        return;
    }

    eventos = data;
    desenharProximos();
    document.dispatchEvent(new CustomEvent('eventos-carregados'));
}


// próximos eventos
// ======================================================
export function proximosEventos(quantidade = 5) {
    const agora = new Date();
    return eventos
        .filter(evento => new Date(evento.end_at || evento.start_at) >= agora)
        .slice(0, quantidade);
}

export function linhaEvento(evento) {
    const fim = evento.end_at ? ` – ${hora(evento.end_at)}` : '';
    return `
        <li class="lista-item">
            <div class="data-evento">
                <span>${new Date(evento.start_at).getDate()}</span>
                <small>${new Date(evento.start_at).toLocaleDateString(local, { month: 'short' }).replace('.', '')}</small>
            </div>
            <div class="lista-principal">
                <p class="lista-titulo">${escapar(evento.title)}</p>
                <p class="lista-sub">${hora(evento.start_at)}${fim}${evento.description ? ' · ' + escapar(evento.description) : ''}</p>
            </div>
            <button type="button" class="botao-link" data-editar-evento="${evento.id}">Editar</button>
        </li>
    `;
}

function desenharProximos() {
    const lista = document.getElementById('lista-proximos');
    const proximos = proximosEventos(8);

    lista.innerHTML = proximos.length
        ? proximos.map(linhaEvento).join('')
        : '<li class="vazio">Sem eventos marcados.</li>';
}


// janela de criar / editar
// ======================================================
const janela = document.getElementById('janela-evento');
const form = document.getElementById('form-evento');

export function abrirEvento(evento, dia) {
    form.reset();

    let inicio = evento?.start_at;
    if (!inicio) {
        const base = dia ? new Date(dia) : new Date();
        base.setHours(dia ? 9 : base.getHours() + 1, 0, 0, 0);
        inicio = base;
    }

    form.id_evento.value = evento?.id || '';
    form.titulo.value = evento?.title || '';
    form.descricao.value = evento?.description || '';
    form.inicio.value = paraInputDataHora(inicio);
    form.fim.value = paraInputDataHora(evento?.end_at);

    let minutos = '';
    if (evento?.reminder_at) {
        minutos = String(Math.round((new Date(evento.start_at) - new Date(evento.reminder_at)) / 60000));
    }
    form.lembrete.value = [...form.lembrete.options].some(opcao => opcao.value === minutos) ? minutos : '';

    document.getElementById('titulo-evento').textContent = evento ? 'Editar evento' : 'Novo evento';
    document.getElementById('apagar-evento').classList.toggle('escondido', !evento);
    janela.showModal();
    form.titulo.focus();
}

export function eventoPorId(id) {
    return eventos.find(evento => evento.id === id);
}

async function guardar(evento) {
    evento.preventDefault();

    const inicio = new Date(form.inicio.value);
    const fim = form.fim.value ? new Date(form.fim.value) : null;

    if (fim && fim < inicio) {
        aviso('O fim não pode ser antes do início.', 'erro');
        return;
    }

    const minutos = form.lembrete.value;
    const dados = {
        title: form.titulo.value.trim(),
        description: form.descricao.value.trim() || null,
        start_at: inicio.toISOString(),
        end_at: fim ? fim.toISOString() : null,
        reminder_at: minutos !== '' ? new Date(inicio.getTime() - Number(minutos) * 60000).toISOString() : null,
    };

    const id = form.id_evento.value;
    const { error } = id
        ? await supabase.from('events').update(dados).eq('id', id)
        : await supabase.from('events').insert(dados);

    if (error) {
        aviso('Não foi possível guardar o evento.', 'erro');
        return;
    }

    janela.close();
    aviso('Evento guardado.');
    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: 'events' }));
}

async function apagar() {
    const id = form.id_evento.value;

    if (!id || !confirm('Apagar este evento?')) {
        return;
    }

    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
        aviso('Não foi possível apagar o evento.', 'erro');
        return;
    }

    janela.close();
    aviso('Evento apagado.');
    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: 'events' }));
}


// início
// ======================================================
export function iniciarAgenda() {
    document.getElementById('novo-evento').addEventListener('click', () => abrirEvento());

    document.addEventListener('click', evento => {
        const id = evento.target.closest?.('[data-editar-evento]')?.dataset.editarEvento;
        if (id) {
            abrirEvento(eventoPorId(id));
        }
    });

    form.addEventListener('submit', guardar);
    document.getElementById('apagar-evento').addEventListener('click', apagar);
    form.querySelector('[data-fechar]').addEventListener('click', () => janela.close());

    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'events') {
            carregarEventos();
        }
    });

    return carregarEventos();
}
