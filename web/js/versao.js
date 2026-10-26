import { t } from './idioma.js';

// versão da app e atualizações (só na app de computador)
const huroh = window.huroh;


// mostrar o estado
// ======================================================
function textoEstado(estado) {
    if (!estado.disponivel) return t('Versão de desenvolvimento: as atualizações só funcionam na app instalada.');

    switch (estado.estado) {
        case 'a-procurar': return t('A procurar atualizações...');
        case 'disponivel': return t('Há uma versão nova: {v}.').replace('{v}', estado.nova);
        case 'a-descarregar': return t('A descarregar a versão {v}...').replace('{v}', estado.nova || '');
        case 'pronta': return t('A versão {v} está pronta. Reinicia para atualizar.').replace('{v}', estado.nova);
        case 'erro': return t('Não foi possível procurar atualizações. Vê a ligação à internet.');
        default: return t('Tens a versão mais recente.');
    }
}

function mostrar(estado) {
    document.getElementById('versao-texto').textContent = 'v' + estado.versao;
    document.getElementById('versao-atual').textContent = t('Versão') + ' ' + estado.versao;
    document.getElementById('versao-estado').textContent = textoEstado(estado);
    document.getElementById('versao-auto').checked = estado.auto;
    document.getElementById('versao-ponto').classList.toggle('escondido', !['disponivel', 'pronta'].includes(estado.estado));

    const barra = document.getElementById('versao-barra');
    barra.classList.toggle('escondido', estado.estado !== 'a-descarregar');
    document.getElementById('versao-progresso').style.width = `${estado.progresso || 0}%`;

    const acao = document.getElementById('versao-acao');
    acao.disabled = !estado.disponivel || ['a-procurar', 'a-descarregar'].includes(estado.estado);
    acao.classList.toggle('botao-principal', estado.estado === 'pronta');
    acao.textContent = estado.estado === 'pronta' ? t('Reiniciar e atualizar')
        : estado.estado === 'disponivel' ? t('Descarregar agora')
        : t('Procurar atualizações');
    acao.dataset.acao = estado.estado === 'pronta' ? 'instalar' : 'procurar';
}


// início
// ======================================================
export async function iniciarVersao() {
    if (!huroh?.atualizacao) return;

    mostrar(await huroh.atualizacao());
    huroh.aoAtualizacao(mostrar);

    document.getElementById('versao-auto').addEventListener('change', evento => {
        huroh.atualizacaoAuto(evento.target.checked);
    });

    document.getElementById('versao-acao').addEventListener('click', evento => {
        if (evento.currentTarget.dataset.acao === 'instalar') huroh.instalarAtualizacao();
        else huroh.procurarAtualizacao();
    });
}
