import { supabase } from './supabase.js';
import { escapar, euros, intervaloDoMes } from './utils.js';

const filtros = document.getElementById('filtros-movimentos');

function mesEscolhido() {
    const valor = filtros.mes.value;

    if (!valor) {
        return intervaloDoMes();
    }

    const [ano, mes] = valor.split('-').map(Number);
    return intervaloDoMes(new Date(ano, mes - 1, 1));
}


// totais do mês
// ======================================================
async function carregarTotais() {
    const { inicio, fim } = mesEscolhido();

    const [mes, total] = await Promise.all([
        supabase.rpc('resumo_financeiro', { inicio, fim }).single(),
        supabase.rpc('resumo_financeiro').single(),
    ]);

    if (mes.error || total.error) {
        return;
    }

    document.getElementById('resumo-rendimentos').textContent = euros(mes.data.rendimentos);
    document.getElementById('resumo-despesas').textContent = euros(mes.data.despesas);

    const saldoMes = document.getElementById('resumo-saldo-mes');
    saldoMes.textContent = euros(mes.data.saldo);
    saldoMes.className = `widget-valor ${Number(mes.data.saldo) < 0 ? 'negativo' : ''}`;

    document.getElementById('resumo-saldo-total').textContent = `Saldo total: ${euros(total.data.saldo)}`;
}


// despesas por categoria e limites
// ======================================================
async function carregarPorCategoria() {
    const { inicio, fim } = mesEscolhido();
    const lista = document.getElementById('lista-por-categoria');

    const { data, error } = await supabase.rpc('despesas_por_categoria', { inicio, fim });

    if (error) {
        return;
    }

    if (data.length === 0) {
        lista.innerHTML = '<li class="vazio">Sem despesas neste mês.</li>';
        return;
    }

    const maior = Math.max(...data.map(linha => Number(linha.total)));

    lista.innerHTML = data.map(linha => {
        const total = Number(linha.total);
        const limite = Number(linha.limite) || 0;
        const base = limite || maior;
        const percentagem = Math.min(100, Math.round((total / base) * 100));
        const passou = limite && total > limite;
        const perto = limite && !passou && total >= limite * 0.8;

        let estado = '';
        if (passou) estado = `<span class="negativo">ultrapassou ${euros(total - limite)}</span>`;
        else if (perto) estado = '<span class="aviso-texto">perto do limite</span>';
        else if (limite) estado = `de ${euros(limite)}`;

        return `
            <li class="barra-categoria">
                <div class="barra-topo">
                    <span><span class="bolinha" style="background-color: ${linha.cor}"></span> ${escapar(linha.nome)}</span>
                    <span>${euros(total)}</span>
                </div>
                <div class="barra">
                    <div class="barra-cheia ${passou ? 'passou' : perto ? 'perto' : ''}"
                         style="width: ${percentagem}%; background-color: ${passou || perto ? '' : linha.cor}"></div>
                </div>
                ${estado ? `<p class="lista-sub">${estado}</p>` : ''}
            </li>
        `;
    }).join('');
}

export function atualizarResumo() {
    carregarTotais();
    carregarPorCategoria();
}


// início
// ======================================================
export function iniciarResumo() {
    filtros.addEventListener('change', atualizarResumo);
    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'transactions') {
            atualizarResumo();
        }
    });
    document.addEventListener('categorias-alteradas', carregarPorCategoria);

    atualizarResumo();
}
