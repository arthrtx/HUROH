import { abrirEvento, linhaEvento, obterEventos } from './agenda.js';
import { dataISO } from './utils.js';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

let mesVisivel = new Date();
let diaEscolhido = dataISO();

function eventosDoDia(dia) {
    return obterEventos().filter(evento => dataISO(new Date(evento.start_at)) === dia);
}


// grelha do mês
// ======================================================
function desenharMes() {
    const ano = mesVisivel.getFullYear();
    const mes = mesVisivel.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const desvio = (primeiro.getDay() + 6) % 7;
    const hoje = dataISO();

    document.getElementById('titulo-mes').textContent =
        primeiro.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });

    let celulas = DIAS_SEMANA.map(dia => `<div class="cal-semana">${dia}</div>`).join('');

    for (let i = 0; i < desvio; i++) {
        celulas += '<div class="cal-vazio"></div>';
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
        const chave = dataISO(new Date(ano, mes, dia));
        const quantos = eventosDoDia(chave).length;
        const classes = ['cal-dia'];
        if (chave === hoje) classes.push('hoje');
        if (chave === diaEscolhido) classes.push('escolhido');

        celulas += `
            <button type="button" class="${classes.join(' ')}" data-dia="${chave}">
                <span>${dia}</span>
                ${quantos ? `<i class="cal-pontos">${'•'.repeat(Math.min(quantos, 3))}</i>` : ''}
            </button>
        `;
    }

    document.getElementById('calendario').innerHTML = celulas;
}


// eventos do dia escolhido
// ======================================================
function desenharDia() {
    const [ano, mes, dia] = diaEscolhido.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const lista = eventosDoDia(diaEscolhido);

    document.getElementById('titulo-dia').textContent =
        data.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

    document.getElementById('lista-dia').innerHTML = lista.length
        ? lista.map(linhaEvento).join('')
        : '<li class="vazio">Nada marcado para este dia.</li>';
}

function atualizar() {
    desenharMes();
    desenharDia();
}


// início
// ======================================================
export function iniciarCalendario() {
    document.getElementById('mes-anterior').addEventListener('click', () => {
        mesVisivel = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() - 1, 1);
        desenharMes();
    });

    document.getElementById('mes-seguinte').addEventListener('click', () => {
        mesVisivel = new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 1);
        desenharMes();
    });

    document.getElementById('mes-hoje').addEventListener('click', () => {
        mesVisivel = new Date();
        diaEscolhido = dataISO();
        atualizar();
    });

    document.getElementById('calendario').addEventListener('click', evento => {
        const botao = evento.target.closest('[data-dia]');
        if (!botao) return;

        if (botao.dataset.dia === diaEscolhido) {
            abrirEvento(null, botao.dataset.dia + 'T00:00');
            return;
        }

        diaEscolhido = botao.dataset.dia;
        atualizar();
    });

    document.getElementById('evento-no-dia').addEventListener('click', () => {
        abrirEvento(null, diaEscolhido + 'T00:00');
    });

    document.addEventListener('eventos-carregados', atualizar);
    atualizar();
}
