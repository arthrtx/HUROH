import { aviso, dataISO } from './utils.js';
import { idioma, mudarIdioma, t } from './idioma.js';
import { guardarNome, perfilAtual } from './perfil.js';
import { apagarConta, terminarSessao } from './sincronizar.js';
import { tudo } from './bd.js';

try {
    localStorage.removeItem('huroh-fundo');
    localStorage.removeItem('huroh-banner');
} catch {}


// foto
// ======================================================
export function reduzirImagem(ficheiro, largura, tipo = 'image/jpeg') {
    return new Promise((resolver, rejeitar) => {
        const imagem = new Image();
        imagem.onload = () => {
            const escala = Math.min(1, largura / imagem.width);
            const tela = document.createElement('canvas');
            tela.width = Math.round(imagem.width * escala);
            tela.height = Math.round(imagem.height * escala);
            tela.getContext('2d').drawImage(imagem, 0, 0, tela.width, tela.height);
            URL.revokeObjectURL(imagem.src);
            resolver(tela.toDataURL(tipo, 0.82));
        };
        imagem.onerror = rejeitar;
        imagem.src = URL.createObjectURL(ficheiro);
    });
}


// início
// ======================================================
export function iniciarDefinicoes(utilizador, perfil) {
    document.querySelectorAll('[data-idioma]').forEach(botao => {
        botao.classList.toggle('ativo', botao.dataset.idioma === idioma);
        botao.addEventListener('click', () => {
            if (botao.dataset.idioma !== idioma) mudarIdioma(botao.dataset.idioma);
        });
    });

    const form = document.getElementById('form-perfil');
    form.nome.value = perfil.nome;
    document.getElementById('perfil-email').value = utilizador.email;

    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        const ok = await guardarNome(form.nome.value.trim());
        aviso(ok ? 'Perfil guardado.' : 'Não foi possível guardar o nome.', ok ? 'ok' : 'erro');
    });

    document.getElementById('botao-sair').addEventListener('click', terminarSessao);
    ligarArranque();
    ligarDados(utilizador);
}


// os teus dados: exportar e apagar a conta
// ======================================================
async function exportarDados(utilizador) {
    const conteudo = {
        app: 'HUROH',
        exportado: new Date().toISOString(),
        conta: { id: utilizador.id, email: utilizador.email, nome: perfilAtual()?.nome || '' },
        tabelas: await tudo(),
    };

    const blob = new Blob([JSON.stringify(conteudo, null, 2)], { type: 'application/json' });
    const ligacao = document.createElement('a');
    ligacao.href = URL.createObjectURL(blob);
    ligacao.download = `huroh-dados-${dataISO()}.json`;
    ligacao.click();
    setTimeout(() => URL.revokeObjectURL(ligacao.href), 5000);
}

function ligarDados(utilizador) {
    const janela = document.getElementById('janela-apagar-conta');
    const form = document.getElementById('form-apagar-conta');
    const botaoApagar = form.querySelector('[type="submit"]');

    document.getElementById('exportar-dados').addEventListener('click', () => exportarDados(utilizador));

    document.getElementById('apagar-conta').addEventListener('click', () => {
        form.reset();
        botaoApagar.disabled = true;
        janela.showModal();
    });

    form.querySelector('[data-cancelar]').addEventListener('click', () => janela.close());
    form.confirmar.addEventListener('input', () => {
        botaoApagar.disabled = form.confirmar.value.trim().toUpperCase() !== 'APAGAR';
    });

    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        botaoApagar.disabled = true;
        botaoApagar.textContent = t('A apagar...');
        try {
            await apagarConta(form.backups.checked);
        } catch (erro) {
            botaoApagar.disabled = false;
            botaoApagar.textContent = t('Apagar tudo');
            aviso(erro.message === 'sem-internet'
                ? 'Precisas de internet para apagar a conta.'
                : 'Não foi possível apagar a conta. Tenta outra vez.', 'erro');
        }
    });
}


// iniciar com o Windows (só na app instalada)
// ======================================================
async function ligarArranque() {
    const huroh = window.huroh;
    if (!huroh?.arranqueDisponivel || !(await huroh.arranqueDisponivel())) return;

    const cartao = document.getElementById('cartao-arranque');
    const botao = document.getElementById('alternar-arranque');
    const estado = document.getElementById('estado-arranque');

    function mostrar(ligado) {
        botao.textContent = t(ligado ? 'Desligar' : 'Ligar');
        estado.textContent = t(ligado
            ? 'Ao ligar o computador, abre só o menu lateral.'
            : 'O HUROH só abre quando o abrires tu.');
    }

    let ligado = await huroh.arranque();
    mostrar(ligado);
    cartao.classList.remove('escondido');

    botao.addEventListener('click', async () => {
        botao.disabled = true;
        ligado = await huroh.arranque(!ligado);
        mostrar(ligado);
        botao.disabled = false;
    });
}
