import { supabase } from './supabase.js';
import { aviso, dataCurta, dataISO, escapar, euros } from './utils.js';
import { categoriaPorId, obterCategorias } from './categorias.js';

const POR_PAGINA = 50;
let movimentos = [];


// carregar
// ======================================================
export async function carregarMovimentos() {
    const { data, error } = await supabase
        .from('transactions')
        .select('id, type, amount, category_id, description, transaction_date')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(POR_PAGINA);

    if (error) {
        aviso('Não foi possível carregar os movimentos.', 'erro');
        return;
    }

    movimentos = data;
    desenharMovimentos();
}


// lista
// ======================================================
function desenharMovimentos() {
    const lista = document.getElementById('lista-movimentos');

    if (movimentos.length === 0) {
        lista.innerHTML = '<li class="vazio">Sem movimentos. Regista o primeiro com "+ Movimento".</li>';
        return;
    }

    lista.innerHTML = movimentos.map(movimento => {
        const categoria = categoriaPorId(movimento.category_id);
        const despesa = movimento.type === 'expense';

        return `
            <li class="lista-item">
                <span class="bolinha" style="background-color: ${categoria?.color || '#8b8b93'}"></span>
                <div class="lista-principal">
                    <p class="lista-titulo">${escapar(movimento.description || categoria?.name || 'Sem descrição')}</p>
                    <p class="lista-sub">${dataCurta(movimento.transaction_date)} · ${escapar(categoria?.name || 'Sem categoria')}</p>
                </div>
                <span class="lista-valor ${despesa ? 'negativo' : 'positivo'}">
                    ${despesa ? '−' : '+'} ${euros(movimento.amount)}
                </span>
                <button type="button" class="botao-link" data-editar="${movimento.id}">Editar</button>
            </li>
        `;
    }).join('');
}


// janela de registar / editar
// ======================================================
const janela = document.getElementById('janela-movimento');
const form = document.getElementById('form-movimento');

function preencherCategorias(selecionada) {
    const tipo = form.tipo.value;
    const opcoes = obterCategorias(tipo).map(categoria =>
        `<option value="${categoria.id}">${escapar(categoria.name)}</option>`
    );

    form.categoria.innerHTML = '<option value="">Sem categoria</option>' + opcoes.join('');
    form.categoria.value = selecionada || '';
}

export function abrirMovimento(movimento, tipo = 'expense') {
    form.reset();
    form.id_movimento.value = movimento?.id || '';
    form.tipo.value = movimento?.type || tipo;
    form.valor.value = movimento?.amount || '';
    form.data.value = movimento?.transaction_date || dataISO();
    form.descricao.value = movimento?.description || '';
    preencherCategorias(movimento?.category_id);

    document.getElementById('titulo-movimento').textContent = movimento ? 'Editar movimento' : 'Novo movimento';
    document.getElementById('apagar-movimento').classList.toggle('escondido', !movimento);
    janela.showModal();
    form.valor.focus();
}

function avisarAlteracao() {
    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: 'transactions' }));
}

async function guardar(evento) {
    evento.preventDefault();

    const valor = Number(String(form.valor.value).replace(',', '.'));

    if (!(valor > 0)) {
        aviso('O valor tem de ser maior que zero.', 'erro');
        return;
    }

    const dados = {
        type: form.tipo.value,
        amount: Math.round(valor * 100) / 100,
        transaction_date: form.data.value,
        category_id: form.categoria.value || null,
        description: form.descricao.value.trim() || null,
    };

    const id = form.id_movimento.value;
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;

    const { error } = id
        ? await supabase.from('transactions').update(dados).eq('id', id)
        : await supabase.from('transactions').insert(dados);

    botao.disabled = false;

    if (error) {
        aviso('Não foi possível guardar o movimento.', 'erro');
        return;
    }

    janela.close();
    aviso(id ? 'Movimento atualizado.' : 'Movimento registado.');
    avisarAlteracao();
}

async function apagar() {
    const id = form.id_movimento.value;

    if (!id || !confirm('Apagar este movimento?')) {
        return;
    }

    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
        aviso('Não foi possível apagar o movimento.', 'erro');
        return;
    }

    janela.close();
    aviso('Movimento apagado.');
    avisarAlteracao();
}


// início
// ======================================================
export function iniciarMovimentos() {
    document.getElementById('novo-movimento').addEventListener('click', () => abrirMovimento());
    document.getElementById('lista-movimentos').addEventListener('click', evento => {
        const id = evento.target.dataset.editar;
        if (id) {
            abrirMovimento(movimentos.find(movimento => movimento.id === id));
        }
    });

    form.addEventListener('submit', guardar);
    document.getElementById('apagar-movimento').addEventListener('click', apagar);
    form.querySelector('[data-fechar]').addEventListener('click', () => janela.close());
    form.querySelectorAll('[name="tipo"]').forEach(opcao => opcao.addEventListener('change', () => preencherCategorias()));

    document.addEventListener('categorias-alteradas', desenharMovimentos);
    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'transactions') {
            carregarMovimentos();
        }
    });

    return carregarMovimentos();
}
