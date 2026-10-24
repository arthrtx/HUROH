import { supabase } from './supabase.js';
import { aviso } from './utils.js';

const WIDGETS = [
    { tipo: 'saldo', nome: 'Saldo', tamanho: 'l' },
    { tipo: 'financas', nome: 'Despesas do mês', tamanho: 'm' },
    { tipo: 'agenda', nome: 'Próximo evento', tamanho: 'm' },
    { tipo: 'tarefas', nome: 'Tarefas', tamanho: 'm' },
    { tipo: 'relogio', nome: 'Relógio', tamanho: 'm' },
    { tipo: 'lembretes', nome: 'Lembretes', tamanho: 'm' },
];

const TAMANHOS = { s: 'Pequeno', m: 'Médio', l: 'Grande' };

let preferencias = [];


// preferências (as que faltam ficam com os valores padrão)
// ======================================================
async function carregarPreferencias() {
    const { data, error } = await supabase
        .from('widget_preferences')
        .select('widget_type, position, size, visible, settings');

    const guardadas = error ? [] : data;

    preferencias = WIDGETS.map((widget, indice) => {
        const guardada = guardadas.find(p => p.widget_type === widget.tipo);
        return {
            widget_type: widget.tipo,
            position: guardada?.position ?? indice,
            size: guardada?.size ?? widget.tamanho,
            visible: guardada?.visible ?? true,
            settings: guardada?.settings ?? {},
        };
    }).sort((a, b) => a.position - b.position);
}

let temporizador;

function guardarDepois() {
    clearTimeout(temporizador);
    temporizador = setTimeout(async () => {
        const linhas = preferencias.map((p, indice) => ({ ...p, position: indice }));
        const { error } = await supabase
            .from('widget_preferences')
            .upsert(linhas, { onConflict: 'user_id,widget_type' });

        if (error) {
            aviso('Não foi possível guardar os widgets.', 'erro');
        }
    }, 600);
}


// aplicar no dashboard
// ======================================================
function aplicarNoDashboard() {
    preferencias.forEach((p, indice) => {
        const elemento = document.querySelector(`#grelha-dashboard [data-widget="${p.widget_type}"]`);
        if (!elemento) return;

        elemento.style.order = indice;
        elemento.classList.toggle('escondido', !p.visible);
        elemento.classList.remove('tamanho-s', 'tamanho-m', 'tamanho-l', 'grande');
        elemento.classList.add(`tamanho-${p.size}`);
    });
}


// página de personalização
// ======================================================
function desenharLista() {
    const lista = document.getElementById('lista-widgets');

    lista.innerHTML = preferencias.map((p, indice) => {
        const nome = WIDGETS.find(w => w.tipo === p.widget_type).nome;
        const opcoes = Object.entries(TAMANHOS).map(([valor, texto]) =>
            `<option value="${valor}" ${p.size === valor ? 'selected' : ''}>${texto}</option>`
        ).join('');

        return `
            <li class="lista-item" data-tipo="${p.widget_type}">
                <input type="checkbox" class="caixa" data-acao="visivel" ${p.visible ? 'checked' : ''}
                       aria-label="Mostrar ${nome}" />
                <div class="lista-principal">
                    <p class="lista-titulo">${nome}</p>
                </div>
                <select class="seletor-pequeno" data-acao="tamanho" aria-label="Tamanho de ${nome}">${opcoes}</select>
                <div class="lista-acoes">
                    <button type="button" class="botao-link" data-acao="subir" ${indice === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>
                    <button type="button" class="botao-link" data-acao="descer" ${indice === preferencias.length - 1 ? 'disabled' : ''} aria-label="Descer">↓</button>
                </div>
            </li>
        `;
    }).join('');
}

function alterar(evento) {
    const item = evento.target.closest('[data-tipo]');
    const acao = evento.target.dataset.acao;
    if (!item || !acao) return;

    const indice = preferencias.findIndex(p => p.widget_type === item.dataset.tipo);
    const p = preferencias[indice];

    if (acao === 'visivel') p.visible = evento.target.checked;
    if (acao === 'tamanho') p.size = evento.target.value;
    if (acao === 'subir' && indice > 0) {
        [preferencias[indice - 1], preferencias[indice]] = [preferencias[indice], preferencias[indice - 1]];
    }
    if (acao === 'descer' && indice < preferencias.length - 1) {
        [preferencias[indice + 1], preferencias[indice]] = [preferencias[indice], preferencias[indice + 1]];
    }

    desenharLista();
    aplicarNoDashboard();
    guardarDepois();
}

async function repor() {
    preferencias = WIDGETS.map((widget, indice) => ({
        widget_type: widget.tipo,
        position: indice,
        size: widget.tamanho,
        visible: true,
        settings: {},
    }));

    desenharLista();
    aplicarNoDashboard();
    guardarDepois();
}


// início
// ======================================================
export async function iniciarWidgets() {
    await carregarPreferencias();
    aplicarNoDashboard();
    desenharLista();

    const lista = document.getElementById('lista-widgets');
    lista.addEventListener('change', alterar);
    lista.addEventListener('click', evento => {
        if (evento.target.tagName === 'BUTTON') alterar(evento);
    });
    document.getElementById('repor-widgets').addEventListener('click', repor);
}
