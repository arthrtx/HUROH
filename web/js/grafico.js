import { supabase } from './supabase.js';
import { dataISO, euros } from './utils.js';

const MESES = 6;


// dados dos últimos meses (em cêntimos, para não haver erros de arredondamento)
// ======================================================
async function obterTotaisPorMes() {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (MESES - 1), 1);

    const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, transaction_date')
        .gte('transaction_date', dataISO(inicio));

    if (error) {
        return null;
    }

    const meses = [];
    for (let i = 0; i < MESES; i++) {
        const data = new Date(inicio.getFullYear(), inicio.getMonth() + i, 1);
        meses.push({
            chave: dataISO(data).slice(0, 7),
            nome: data.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', ''),
            rendimentos: 0,
            despesas: 0,
        });
    }

    data.forEach(movimento => {
        const mes = meses.find(m => m.chave === movimento.transaction_date.slice(0, 7));
        if (!mes) return;

        const centimos = Math.round(Number(movimento.amount) * 100);
        if (movimento.type === 'income') mes.rendimentos += centimos;
        else mes.despesas += centimos;
    });

    return meses;
}


// desenho em SVG
// ======================================================
function desenhar(meses) {
    const caixa = document.getElementById('grafico-meses');
    const maior = Math.max(1, ...meses.flatMap(m => [m.rendimentos, m.despesas]));

    const largura = 600;
    const altura = 220;
    const fundo = 190;
    const coluna = largura / meses.length;
    const barra = Math.min(22, coluna / 4);

    const barras = meses.map((mes, i) => {
        const centro = coluna * i + coluna / 2;
        const alturaR = (mes.rendimentos / maior) * 160;
        const alturaD = (mes.despesas / maior) * 160;

        return `
            <g>
                <title>${mes.nome}: +${euros(mes.rendimentos / 100)} / −${euros(mes.despesas / 100)}</title>
                <rect class="barra-r" x="${centro - barra - 2}" y="${fundo - alturaR}" width="${barra}" height="${alturaR}" rx="4" />
                <rect class="barra-d" x="${centro + 2}" y="${fundo - alturaD}" width="${barra}" height="${alturaD}" rx="4" />
                <text x="${centro}" y="${altura - 6}" text-anchor="middle">${mes.nome}</text>
            </g>
        `;
    }).join('');

    caixa.innerHTML = `
        <svg viewBox="0 0 ${largura} ${altura}" role="img" aria-label="Rendimentos e despesas dos últimos ${MESES} meses">
            <line class="linha-base" x1="0" y1="${fundo}" x2="${largura}" y2="${fundo}" />
            ${barras}
        </svg>
    `;
}

export async function atualizarGrafico() {
    const meses = await obterTotaisPorMes();
    if (meses) {
        desenhar(meses);
    }
}


// início
// ======================================================
export function iniciarGrafico() {
    document.addEventListener('dados-alterados', evento => {
        if (evento.detail === 'transactions') {
            atualizarGrafico();
        }
    });

    atualizarGrafico();
}
