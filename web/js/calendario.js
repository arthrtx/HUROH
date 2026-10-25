import { local, t } from './idioma.js';
import { abrirEvento, obterEventos } from './agenda.js';
import { abrirTarefa, obterTarefas } from './tarefas.js';
import { dataISO, escapar, hora } from './utils.js';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

let mesVisivel = new Date();
let diaEscolhido = dataISO();

function eventosDoDia(dia) {
    return obterEventos().filter(evento => dataISO(new Date(evento.start_at)) === dia);
}

function tarefasDoDia(dia) {
    return obterTarefas().filter(tarefa => tarefa.due_at && dataISO(new Date(tarefa.due_at)) === dia);
}

// feriados
// ======================================================
function domingoDePascoa(ano) {
    const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(ano, mes - 1, dia);
}

const cacheFeriados = new Map();

function feriadosDoAno(ano) {
    if (cacheFeriados.has(ano)) return cacheFeriados.get(ano);

    const pascoa = domingoDePascoa(ano);
    const aPartirDaPascoa = dias => dataISO(new Date(ano, pascoa.getMonth(), pascoa.getDate() + dias));
    const lista = {
        [`${ano}-01-01`]: 'Ano Novo',
        [aPartirDaPascoa(-47)]: 'Carnaval',
        [aPartirDaPascoa(-2)]: 'Sexta-feira Santa',
        [aPartirDaPascoa(0)]: 'Páscoa',
        [`${ano}-04-25`]: 'Dia da Liberdade',
        [`${ano}-05-01`]: 'Dia do Trabalhador',
        [aPartirDaPascoa(60)]: 'Corpo de Deus',
        [`${ano}-06-10`]: 'Dia de Portugal',
        [`${ano}-08-15`]: 'Assunção de Nossa Senhora',
        [`${ano}-10-05`]: 'Implantação da República',
        [`${ano}-11-01`]: 'Dia de Todos-os-Santos',
        [`${ano}-12-01`]: 'Restauração da Independência',
        [`${ano}-12-08`]: 'Imaculada Conceição',
        [`${ano}-12-25`]: 'Natal',
    };
    cacheFeriados.set(ano, lista);
    return lista;
}

export function feriado(chave) {
    return feriadosDoAno(Number(chave.slice(0, 4)))[chave] || null;
}

function plural(n, um, varios) {
    return `${n} ${t(n === 1 ? um : varios)}`;
}


// grelha do mês
// ======================================================
function celula(data, foraDoMes) {
    const chave = dataISO(data);
    const eventos = eventosDoDia(chave).length;
    const tarefas = tarefasDoDia(chave).length;
    const classes = ['cal-dia'];
    if (foraDoMes) classes.push('fora');
    if (chave === dataISO()) classes.push('hoje');
    if (chave === diaEscolhido) classes.push('escolhido');
    const nomeFeriado = feriado(chave);
    if (nomeFeriado) classes.push('feriado');

    const pontos = '<i class="ponto-cheio"></i>'.repeat(Math.min(eventos, 2)) + '<i class="ponto-vazio"></i>'.repeat(Math.min(tarefas, 2));

    return `
        <button type="button" class="${classes.join(' ')}" data-dia="${chave}"${nomeFeriado ? ` title="${t(nomeFeriado)}"` : ''}>
            <span>${data.getDate()}</span>
            <span class="cal-pontos">${pontos}</span>
        </button>`;
}

function desenharMes() {
    const ano = mesVisivel.getFullYear();
    const mes = mesVisivel.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const desvio = (primeiro.getDay() + 6) % 7;
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const semanas = Math.ceil((desvio + diasNoMes) / 7);

    const nome = primeiro.toLocaleDateString(local, { month: 'long' });
    document.getElementById('titulo-mes').textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
    document.getElementById('titulo-ano').textContent = ano;

    let celulas = DIAS_SEMANA.map(dia => `<div class="cal-semana">${dia}</div>`).join('');

    for (let i = 0; i < semanas * 7; i++) {
        const data = new Date(ano, mes, 1 - desvio + i);
        celulas += celula(data, data.getMonth() !== mes);
    }

    document.getElementById('calendario').innerHTML = celulas;
}


// dia escolhido
// ======================================================
function desenharDia() {
    const [ano, mes, dia] = diaEscolhido.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const eventos = eventosDoDia(diaEscolhido);
    const tarefas = tarefasDoDia(diaEscolhido);

    const titulo = diaEscolhido === dataISO()
        ? 'Hoje'
        : data.toLocaleDateString(local, { weekday: 'long', day: 'numeric', month: 'long' });
    document.getElementById('titulo-dia').textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);
    const nomeFeriado = feriado(diaEscolhido);
    document.getElementById('resumo-dia-agenda').textContent =
        `${nomeFeriado ? t(nomeFeriado) + ' · ' : ''}${plural(eventos.length, 'evento', 'eventos')}, ${plural(tarefas.length, 'tarefa', 'tarefas')}`;

    const itens = [
        ...eventos.map(e => ({
            quando: e.start_at,
            html: `
                <li data-editar-evento="${e.id}">
                    <i class="ponto-dia evento"></i>
                    <div>
                        <p>${escapar(e.title)}</p>
                        <small>${hora(e.start_at)}${e.end_at ? ' - ' + hora(e.end_at) : ''}</small>
                    </div>
                </li>`,
        })),
        ...tarefas.map(t => ({
            quando: t.due_at,
            html: `
                <li data-tarefa-dia="${t.id}" class="${t.completed ? 'feita' : ''}">
                    <i class="ponto-dia tarefa"></i>
                    <div>
                        <p>${escapar(t.title)}</p>
                        <small>${hora(t.due_at)}</small>
                    </div>
                </li>`,
        })),
    ].sort((a, b) => new Date(a.quando) - new Date(b.quando));

    if (nomeFeriado) {
        itens.unshift({ quando: '', html: `
            <li class="feriado-item">
                <i class="ponto-dia feriado"></i>
                <div><p>${escapar(t(nomeFeriado))}</p><small>${t('Feriado nacional')}</small></div>
            </li>` });
    }

    document.getElementById('lista-dia').innerHTML = itens.length
        ? itens.map(i => i.html).join('')
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
        const [ano, mes] = diaEscolhido.split('-').map(Number);
        if (mes - 1 !== mesVisivel.getMonth()) mesVisivel = new Date(ano, mes - 1, 1);
        atualizar();
    });

    document.getElementById('lista-dia').addEventListener('click', evento => {
        const id = evento.target.closest('[data-tarefa-dia]')?.dataset.tarefaDia;
        const tarefa = obterTarefas().find(t => String(t.id) === id);
        if (tarefa) abrirTarefa(tarefa);
    });

    const novoNoDia = () => abrirEvento(null, diaEscolhido + 'T00:00');
    document.getElementById('evento-no-dia').addEventListener('click', novoNoDia);

    document.addEventListener('eventos-carregados', atualizar);
    document.addEventListener('tarefas-carregadas', atualizar);
    atualizar();
}
