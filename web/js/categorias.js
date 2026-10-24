import { supabase } from './supabase.js';
import { aviso, escapar, euros } from './utils.js';

let categorias = [];

export function obterCategorias(tipo) {
    return tipo ? categorias.filter(categoria => categoria.type === tipo) : categorias;
}

export function categoriaPorId(id) {
    return categorias.find(categoria => categoria.id === id);
}


// carregar
// ======================================================
export async function carregarCategorias() {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, type, color, monthly_limit')
        .order('type', { ascending: false })
        .order('name');

    if (error) {
        aviso('Não foi possível carregar as categorias.', 'erro');
        return;
    }

    categorias = data;
    desenharCategorias();
    document.dispatchEvent(new CustomEvent('categorias-alteradas'));
}


// lista
// ======================================================
function desenharCategorias() {
    const lista = document.getElementById('lista-categorias');

    if (categorias.length === 0) {
        lista.innerHTML = '<li class="vazio">Ainda não tens categorias.</li>';
        return;
    }

    lista.innerHTML = categorias.map(categoria => `
        <li class="lista-item">
            <span class="bolinha" style="background-color: ${categoria.color}"></span>
            <div class="lista-principal">
                <p class="lista-titulo">${escapar(categoria.name)}</p>
                <p class="lista-sub">
                    ${categoria.type === 'income' ? 'Rendimento' : 'Despesa'}
                    ${categoria.monthly_limit ? ` · limite ${euros(categoria.monthly_limit)}/mês` : ''}
                </p>
            </div>
            <div class="lista-acoes">
                <button type="button" class="botao-link" data-editar="${categoria.id}">Editar</button>
            </div>
        </li>
    `).join('');
}


// janela de criar / editar
// ======================================================
const janela = document.getElementById('janela-categoria');
const form = document.getElementById('form-categoria');

function mostrarLimite() {
    form.limite.closest('.campo').classList.toggle('escondido', form.tipo.value !== 'expense');
}

function abrirJanela(categoria) {
    form.reset();
    form.id_categoria.value = categoria?.id || '';
    form.nome.value = categoria?.name || '';
    form.tipo.value = categoria?.type || 'expense';
    form.cor.value = categoria?.color || '#8b8b93';
    form.limite.value = categoria?.monthly_limit || '';

    document.getElementById('titulo-categoria').textContent = categoria ? 'Editar categoria' : 'Nova categoria';
    document.getElementById('apagar-categoria').classList.toggle('escondido', !categoria);
    mostrarLimite();
    janela.showModal();
}

async function guardar(evento) {
    evento.preventDefault();

    const dados = {
        name: form.nome.value.trim(),
        type: form.tipo.value,
        color: form.cor.value,
        monthly_limit: form.tipo.value === 'expense' && form.limite.value ? Number(form.limite.value) : null,
    };

    const id = form.id_categoria.value;
    const pedido = id
        ? supabase.from('categories').update(dados).eq('id', id)
        : supabase.from('categories').insert(dados);

    const { error } = await pedido;

    if (error) {
        const repetida = error.code === '23505';
        aviso(repetida ? 'Já existe uma categoria com esse nome.' : 'Não foi possível guardar a categoria.', 'erro');
        return;
    }

    janela.close();
    aviso('Categoria guardada.');
    carregarCategorias();
}

async function apagar() {
    const id = form.id_categoria.value;

    if (!id || !confirm('Apagar esta categoria? Os movimentos ficam sem categoria.')) {
        return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
        aviso('Não foi possível apagar a categoria.', 'erro');
        return;
    }

    janela.close();
    aviso('Categoria apagada.');
    await carregarCategorias();
    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: 'transactions' }));
}


// início
// ======================================================
export function iniciarCategorias() {
    document.getElementById('nova-categoria').addEventListener('click', () => abrirJanela());
    document.getElementById('lista-categorias').addEventListener('click', evento => {
        const id = evento.target.dataset.editar;
        if (id) {
            abrirJanela(categoriaPorId(id));
        }
    });

    form.addEventListener('submit', guardar);
    document.getElementById('apagar-categoria').addEventListener('click', apagar);
    form.querySelector('[data-fechar]').addEventListener('click', () => janela.close());
    form.querySelectorAll('[name="tipo"]').forEach(opcao => opcao.addEventListener('change', mostrarLimite));

    return carregarCategorias();
}
