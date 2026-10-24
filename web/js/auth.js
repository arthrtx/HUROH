import { supabase } from './supabase.js';

const mensagem = document.getElementById('mensagem');
const formularios = document.querySelectorAll('.formulario');
const separadores = document.getElementById('separadores');

try {
    if (localStorage.getItem('tema') === 'claro') {
        document.body.classList.add('tema-claro');
    }
} catch {}


// mudar de formulário
// ======================================================
function mostrar(modo) {
    formularios.forEach(form => form.classList.toggle('escondido', form.dataset.modo !== modo));
    separadores.classList.toggle('escondido', modo === 'recuperar' || modo === 'nova-senha');
    separadores.querySelectorAll('.separador').forEach(botao => {
        botao.classList.toggle('ativo', botao.dataset.modo === modo);
    });
    escrever('');
}

function escrever(texto, tipo = '') {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

function traduzirErro(erro) {
    const texto = erro?.message || '';

    if (texto.includes('Invalid login credentials')) return 'Email ou palavra-passe errados.';
    if (texto.includes('Email not confirmed')) return 'Confirma primeiro o teu email (vê a caixa de entrada).';
    if (texto.includes('User already registered')) return 'Já existe uma conta com este email.';
    if (texto.includes('Password should be')) return 'A palavra-passe é demasiado fraca.';
    if (texto.includes('rate limit')) return 'Demasiadas tentativas. Espera um pouco e tenta outra vez.';

    return 'Algo correu mal. Tenta outra vez.';
}

async function enviar(form, acao) {
    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    escrever('');

    try {
        await acao(new FormData(form));
    } catch (erro) {
        escrever(traduzirErro(erro), 'erro');
    } finally {
        botao.disabled = false;
    }
}

separadores.addEventListener('click', evento => {
    const modo = evento.target.dataset.modo;
    if (modo) {
        mostrar(modo);
    }
});

document.getElementById('link-recuperar').addEventListener('click', () => mostrar('recuperar'));
document.getElementById('link-voltar').addEventListener('click', () => mostrar('entrar'));


// entrar
// ======================================================
document.getElementById('form-entrar').addEventListener('submit', evento => {
    evento.preventDefault();
    enviar(evento.target, async dados => {
        const { error } = await supabase.auth.signInWithPassword({
            email: dados.get('email').trim(),
            password: dados.get('senha'),
        });
        if (error) throw error;
        location.replace('index.html');
    });
});


// criar conta
// ======================================================
document.getElementById('form-registar').addEventListener('submit', evento => {
    evento.preventDefault();
    enviar(evento.target, async dados => {
        const { data, error } = await supabase.auth.signUp({
            email: dados.get('email').trim(),
            password: dados.get('senha'),
            options: {
                data: { display_name: dados.get('nome').trim() },
                emailRedirectTo: new URL('index.html', location.href).href,
            },
        });
        if (error) throw error;

        if (data.session) {
            location.replace('index.html');
            return;
        }

        evento.target.reset();
        mostrar('entrar');
        escrever('Conta criada. Confirma o email que te enviámos e depois entra.', 'ok');
    });
});


// recuperar acesso
// ======================================================
document.getElementById('form-recuperar').addEventListener('submit', evento => {
    evento.preventDefault();
    enviar(evento.target, async dados => {
        const { error } = await supabase.auth.resetPasswordForEmail(dados.get('email').trim(), {
            redirectTo: new URL('login.html', location.href).href,
        });
        if (error) throw error;
        escrever('Se o email existir, vais receber um link em breve.', 'ok');
    });
});

document.getElementById('form-nova-senha').addEventListener('submit', evento => {
    evento.preventDefault();
    enviar(evento.target, async dados => {
        const { error } = await supabase.auth.updateUser({ password: dados.get('senha') });
        if (error) throw error;
        escrever('Palavra-passe alterada. A entrar...', 'ok');
        setTimeout(() => location.replace('index.html'), 1000);
    });
});

supabase.auth.onAuthStateChange(evento => {
    if (evento === 'PASSWORD_RECOVERY') {
        mostrar('nova-senha');
    }
});


// já tem sessão? vai direto para o painel
// ======================================================
const { data: { session } } = await supabase.auth.getSession();
const veioRecuperar = location.hash.includes('type=recovery');

if (session && !veioRecuperar) {
    location.replace('index.html');
}
