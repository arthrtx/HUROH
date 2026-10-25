import { supabase } from './supabase.js';
import { dataCurta, dataISO, escapar, euros, intervaloDoMes } from './utils.js';
import { t } from './idioma.js';

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

    desenharBolsas(inicio, fim);
}


// rendimentos e despesas
// ======================================================
async function desenharBolsas(inicio, fim) {
    const { data } = await supabase
        .from('transactions')
        .select('type, amount, description, transaction_date, created_at')
        .gte('transaction_date', inicio)
        .lte('transaction_date', fim)
        .order('transaction_date');

    const movimentos = data || [];
    const [ano, mes] = inicio.split('-').map(Number);
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const hoje = new Date();
    const ultimoDia = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes ? hoje.getDate() : diasNoMes;

    [['income', 'bolsa-r'], ['expense', 'bolsa-d']].forEach(([tipo, pre]) => {
        const doTipo = movimentos.filter(m => m.type === tipo);

        const pontos = [];
        let soma = 0;
        for (let dia = 1; dia <= ultimoDia; dia++) {
            const chave = dataISO(new Date(ano, mes - 1, dia));
            doTipo.filter(m => m.transaction_date === chave).forEach(m => { soma += Number(m.amount); });
            pontos.push(soma);
        }
        linha(document.getElementById(`${pre}-grafico`), pontos, tipo === 'income' ? '#34d399' : '#ff5c6c');

        const ultimo = doTipo.slice().sort((a, b) => (a.transaction_date + a.created_at).localeCompare(b.transaction_date + b.created_at)).pop();
        document.getElementById(`${pre}-ultimo-nome`).textContent = ultimo ? (ultimo.description || t(tipo === 'income' ? 'Rendimento' : 'Despesa')) : t('Sem movimentos');
        document.getElementById(`${pre}-ultimo-valor`).textContent = ultimo ? `${tipo === 'income' ? '+' : '−'}${euros(ultimo.amount)} · ${dataCurta(ultimo.transaction_date)}` : '';

        document.getElementById(`${pre}-movs`).textContent = `${doTipo.length} ${t(doTipo.length === 1 ? 'movimento' : 'movimentos')}`;
        document.getElementById(`${pre}-media`).textContent = doTipo.length ? `${t('média')} ${euros(soma / doTipo.length)}` : '';
    });
}

function linha(svg, pontos, cor) {
    if (!svg) return;
    if (pontos.length < 2) pontos = [0, ...pontos, pontos[pontos.length - 1] || 0];
    const maior = Math.max(1, ...pontos);
    const coords = pontos.map((v, i) => [(i / (pontos.length - 1)) * 300, 54 - (v / maior) * 46]);
    const caminho = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const id = svg.id + '-area';

    svg.innerHTML = `
        <defs>
            <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="${cor}" stop-opacity="0.35" />
                <stop offset="1" stop-color="${cor}" stop-opacity="0" />
            </linearGradient>
        </defs>
        <line x1="0" y1="54" x2="300" y2="54" class="bolsa-base" />
        <path d="${caminho} L300,60 L0,60 Z" fill="url(#${id})" />
        <path d="${caminho}" fill="none" stroke="${cor}" stroke-width="2" vector-effect="non-scaling-stroke" class="bolsa-linha" />
    `;
}


// categorias
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
