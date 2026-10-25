import { aviso } from './utils.js';
import { idioma, mudarIdioma } from './idioma.js';
import { guardarNome } from './perfil.js';
import { supabase } from './supabase.js';

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

    document.getElementById('botao-sair').addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.replace('login.html');
    });
}
