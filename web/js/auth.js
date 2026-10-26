import './idioma.js';
import { obterSessao, supabase } from './supabase.js';
import './janela.js';
import { mostrarTermos } from './termos.js';

// as contas são só com o Google: sem palavras-passe guardadas na HUROH
const mensagem = document.getElementById('mensagem');
const botaoGoogle = document.getElementById('entrar-google');

if (window.huroh?.desktop) {
    document.body.classList.add('desktop');
    document.body.classList.toggle('vidro', Boolean(window.huroh.vidro));
}

try {
    if (localStorage.getItem('tema') === 'claro') {
        document.body.classList.add('tema-claro');
    }
} catch {}


// mensagens
// ======================================================
function escrever(texto, tipo = '') {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    ajustarJanela();
}

// na app de computador a janela fica do tamanho do que está à vista
function ajustarJanela() {
    if (!window.huroh?.alturaLogin) return;

    requestAnimationFrame(() => {
        const cartao = document.querySelector('.entrada-cartao');
        const topo = cartao.getBoundingClientRect().top;
        let fundo = 0;
        for (const filho of cartao.children) {
            if (filho.classList.contains('led') || !filho.offsetParent) continue;
            fundo = Math.max(fundo, filho.getBoundingClientRect().bottom);
        }
        window.huroh.alturaLogin(Math.ceil(fundo - topo + 56));
    });
}

function erroGoogle() {
    botaoGoogle.disabled = false;
    escrever('Não foi possível entrar com o Google.', 'erro');
}


// entrar com o Google
// ======================================================
async function entrarComGoogle() {
    escrever('');

    // no navegador a página vai para o Google e volta sozinha ao painel
    if (!window.huroh?.prepararGoogle) {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: new URL('index.html', location.href).href },
        });
        if (error) erroGoogle();
        return;
    }

    // na app de computador o login abre no navegador do PC
    botaoGoogle.disabled = true;
    const destino = await window.huroh.prepararGoogle();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: destino, skipBrowserRedirect: true },
    });

    if (error || !data?.url) return erroGoogle();

    window.huroh.abrirGoogle(data.url);
    escrever('Continua no navegador que acabou de abrir.', 'ok');
}

window.huroh?.aoEntrarGoogle?.(async sessao => {
    if (!sessao) return erroGoogle();

    const { error } = await supabase.auth.setSession(sessao);
    if (error) return erroGoogle();

    location.replace('index.html');
});

botaoGoogle.addEventListener('click', entrarComGoogle);

document.querySelectorAll('[data-ver-termos]').forEach(botao => {
    botao.addEventListener('click', evento => {
        evento.preventDefault();
        mostrarTermos();
    });
});


// sessão
// ======================================================
if (location.hash === '#conta-apagada') {
    history.replaceState(null, '', location.pathname);
    escrever('A tua conta e todos os teus dados foram apagados.', 'ok');
}

const session = await obterSessao();
if (session) location.replace('index.html');

document.fonts.ready.then(ajustarJanela);
requestAnimationFrame(() => requestAnimationFrame(() => window.huroh?.janelaPronta?.()));
