import { t } from './idioma.js';

// tutorial de boas-vindas: navega pela app e explica o que não é óbvio
// ======================================================
const PASSOS = [
    {
        pagina: 'dashboard',
        alvo: null,
        titulo: 'Bem-vindo ao HUROH',
        texto: 'Vamos ver o essencial em menos de um minuto. Podes saltar o tutorial quando quiseres.',
    },
    {
        pagina: 'dashboard',
        alvo: '.banner-botoes',
        titulo: 'Registo rápido',
        texto: 'Regista já uma despesa ou um rendimento aqui, sem sair do dashboard.',
    },
    {
        pagina: 'dashboard',
        alvo: '#botao-lateral',
        lateral: true,
        titulo: 'Menu lateral',
        texto: 'O menu lateral aparece ao encostar o rato à esquerda do ecrã. Este botão mostra-o ou esconde-o quando quiseres.',
    },
    {
        pagina: 'dashboard',
        alvo: '#pesquisa',
        titulo: 'Pesquisa',
        texto: 'Procura movimentos, tarefas e eventos em todo o HUROH. Também abre com Ctrl K.',
    },
    {
        pagina: 'dashboard',
        alvo: '#botao-tema',
        titulo: 'Tema',
        texto: 'Claro ou escuro: aqui escolhes o aspeto da app.',
    },
    {
        pagina: 'dashboard',
        alvo: '#botao-notificacoes',
        titulo: 'Notificações',
        texto: 'Os lembretes de eventos e os prazos das tarefas aparecem aqui.',
    },
    {
        pagina: 'dashboard',
        alvo: '#botao-perfil',
        titulo: 'A tua conta',
        texto: 'Vê o teu perfil, vai às definições ou termina a sessão.',
    },
    {
        pagina: 'financas',
        alvo: '#novo-movimento',
        titulo: 'Finanças',
        texto: 'Cria movimentos com este botão e filtra-os por mês, tipo ou categoria. Cada categoria pode ter um limite mensal.',
    },
    {
        pagina: 'agenda',
        alvo: '#cal-cartao',
        titulo: 'Agenda',
        texto: 'Alterna entre vista semanal e mensal, carrega num dia para ver os eventos e marca lembretes. Os feriados já vêm marcados.',
    },
    {
        pagina: 'tarefas',
        alvo: '#lista-tarefas',
        titulo: 'Tarefas',
        texto: 'Estão divididas por prioridade. Dá-lhes prazo e mostra as concluídas quando quiseres rever.',
    },
    {
        pagina: 'definicoes',
        alvo: '.definicoes-grelha',
        titulo: 'Definições',
        texto: 'Muda a tua foto, o tema e o idioma, ativa as notificações, exporta os dados ou apaga a conta.',
    },
    {
        pagina: 'dashboard',
        alvo: null,
        titulo: 'Está tudo pronto',
        texto: 'O dashboard mostra o teu saldo, o mês e os próximos eventos. Agora aproveita a app e descobre as demais funcionalidades!',
    },
];

const ESPERA = 1600;
const MARGEM = 10;

let dono = null;
let passos = [];
let indice = 0;
let fundo = null;
let cobertura = null;
let aro = null;
let cartao = null;
let lateralAtivado = false;


// criar e destruir
// ======================================================
function elementoVisivel(seletor) {
    const elemento = document.querySelector(seletor);
    return Boolean(elemento) && elemento.getBoundingClientRect().width > 0;
}

// o que não está à vista (por exemplo o menu lateral no telemóvel) fica de fora
function passoVisivel(passo) {
    return !passo.alvo || elementoVisivel(passo.alvo);
}

function criar() {
    fundo = document.createElement('div');
    fundo.className = 'tutorial-fundo';

    cobertura = document.createElement('div');
    cobertura.className = 'tutorial-cobertura';

    aro = document.createElement('div');
    aro.className = 'tutorial-aro';

    cartao = document.createElement('div');
    cartao.className = 'tutorial-caixa';
    cartao.innerHTML = `
        <div class="tutorial-topo">
            <div class="tutorial-pontos"></div>
            <button type="button" class="botao-link tutorial-pular">${t('Pular')}</button>
        </div>
        <h3 class="tutorial-titulo"></h3>
        <p class="tutorial-texto"></p>
        <div class="tutorial-botoes">
            <button type="button" class="botao tutorial-anterior" aria-label="${t('Anterior')}">
                <svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>
            </button>
            <button type="button" class="botao botao-principal tutorial-seguinte" aria-label="${t('Seguinte')}"></button>
        </div>`;

    document.body.append(fundo, cobertura, aro, cartao);

    cartao.querySelector('.tutorial-pular').addEventListener('click', terminar);
    cartao.querySelector('.tutorial-anterior').addEventListener('click', passoAnterior);
    cartao.querySelector('.tutorial-seguinte').addEventListener('click', passoSeguinte);
}

function terminar() {
    window.removeEventListener('resize', posicionar);
    window.removeEventListener('scroll', posicionar, true);
    document.removeEventListener('keydown', teclas);

    if (lateralAtivado) {
        window.huroh?.mostrarLateral?.(false);
        lateralAtivado = false;
    }

    fundo.remove();
    cobertura.remove();
    aro.remove();
    cartao.remove();
    fundo = cobertura = aro = cartao = null;
    document.body.classList.remove('tutorial-aberto');

    try {
        localStorage.setItem('tutorial-' + dono.id, '1');
    } catch {}
    dono = null;
}


// mostrar o passo
// ======================================================
function posicionar() {
    const elemento = passos[indice].alvo && document.querySelector(passos[indice].alvo);

    if (!elemento) {
        fundo.style.clipPath = 'none';
        aro.style.display = 'none';
        return;
    }

    const retangulo = elemento.getBoundingClientRect();
    const x1 = retangulo.left - MARGEM;
    const y1 = retangulo.top - MARGEM;
    const x2 = retangulo.right + MARGEM;
    const y2 = retangulo.bottom + MARGEM;

    aro.style.display = '';
    aro.style.left = `${x1}px`;
    aro.style.top = `${y1}px`;
    aro.style.width = `${x2 - x1}px`;
    aro.style.height = `${y2 - y1}px`;

    // um buraco no véu por cima do elemento (o resto fica com blur e escurecido)
    fundo.style.clipPath =
        `polygon(evenodd, 0px 0px, ${innerWidth}px 0px, ${innerWidth}px ${innerHeight}px, 0px ${innerHeight}px, 0px 0px, ` +
        `${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px)`;
}

function desenhar() {
    let passo = passos[indice];

    if (passo.pagina) {
        document.dispatchEvent(new CustomEvent('navegar', { detail: passo.pagina }));
    }

    let saltos = 0;
    while (!passoVisivel(passo) && saltos < passos.length) {
        indice = (indice + 1) % passos.length;
        saltos++;
        passo = passos[indice];
        if (passo.pagina) {
            document.dispatchEvent(new CustomEvent('navegar', { detail: passo.pagina }));
        }
    }
    if (!passoVisivel(passo)) return terminar();

    // no passo do menu lateral ele é ativado para o tutorial o mostrar; no resto fica desligado
    if (passo.lateral) {
        window.huroh?.mostrarLateral?.(true);
        lateralAtivado = true;
    } else if (lateralAtivado) {
        window.huroh?.mostrarLateral?.(false);
        lateralAtivado = false;
    }

    cartao.querySelector('.tutorial-titulo').textContent = t(passo.titulo);
    cartao.querySelector('.tutorial-texto').textContent = t(passo.texto);
    cartao.querySelector('.tutorial-anterior').disabled = indice === 0;

    const ultimo = indice === passos.length - 1;
    cartao.querySelector('.tutorial-seguinte').innerHTML = ultimo
        ? t('Começar')
        : '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

    cartao.querySelector('.tutorial-pontos').innerHTML =
        passos.map((_, i) => `<span${i === indice ? ' class="ativo"' : ''}></span>`).join('');

    // volta a pôr a animação de entrada do conteúdo (desaparece e aparece a seguir)
    cartao.classList.remove('tutorial-troca');
    void cartao.offsetWidth;
    cartao.classList.add('tutorial-troca');

    posicionar();
    setTimeout(posicionar, 450);
}


// andar para a frente e para trás
// ======================================================
function passoSeguinte() {
    if (indice + 1 >= passos.length) return terminar();
    indice++;
    desenhar();
}

function passoAnterior() {
    if (indice === 0) return;
    indice--;
    desenhar();
}

function teclas(evento) {
    if (evento.key === 'Escape') return terminar();
    if (evento.key === 'ArrowRight') passoSeguinte();
    if (evento.key === 'ArrowLeft') passoAnterior();
}


// início
// ======================================================
export function iniciarTutorial(utilizador) {
    try {
        if (localStorage.getItem('tutorial-' + utilizador.id)) return;
    } catch {}

    // espera que as animações de abertura terminem antes de aparecer
    setTimeout(() => {
        dono = utilizador;
        passos = PASSOS;
        indice = 0;
        window.huroh?.mostrarLateral?.(false);
        criar();
        document.body.classList.add('tutorial-aberto');

        window.addEventListener('resize', posicionar);
        window.addEventListener('scroll', posicionar, true);
        document.addEventListener('keydown', teclas);

        desenhar();
    }, ESPERA);
}
