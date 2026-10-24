import { supabase } from './supabase.js';
import { iniciarDefinicoes } from './definicoes.js';
import { iniciarCategorias } from './categorias.js';
import { iniciarMovimentos } from './movimentos.js';
import { iniciarResumo } from './resumo.js';
import { iniciarGrafico } from './grafico.js';
import { iniciarTarefas } from './tarefas.js';
import { iniciarAgenda } from './agenda.js';
import { iniciarCalendario } from './calendario.js';
import { iniciarDashboard } from './dashboard.js';
import { iniciarTempoReal } from './tempo-real.js';
import { iniciarWidgets } from './widgets.js';
import { iniciarNotificacoes } from './notificacoes.js';


// sessão
// ======================================================
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
    location.replace('login.html');
    throw new Error('sem sessão');
}

export const utilizador = session.user;

supabase.auth.onAuthStateChange(evento => {
    if (evento === 'SIGNED_OUT') {
        location.replace('login.html');
    }
});

function mostrarNome(nome) {
    document.getElementById('saudacao').textContent = `Olá, ${nome}`;
}

async function carregarPerfil() {
    const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', utilizador.id)
        .single();

    return { nome: data?.display_name || utilizador.email.split('@')[0] };
}


// relógio
// ======================================================
const relogioHora = document.getElementById('relogio-hora');
const relogioData = document.getElementById('relogio-data');

function atualizarRelogio() {
    const agora = new Date();
    relogioHora.textContent = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    relogioData.textContent = agora.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
}

atualizarRelogio();
setInterval(atualizarRelogio, 1000);


// navegação entre páginas
// ======================================================
const links = document.querySelectorAll('.menu nav a');
const paginas = document.querySelectorAll('.pagina');

function mostrarPagina(id) {
    const existe = Array.from(paginas).some(pagina => pagina.id === id);

    if (!existe) {
        id = 'dashboard';
    }

    paginas.forEach(pagina => {
        pagina.classList.toggle('ativa', pagina.id === id);
    });

    links.forEach(link => {
        link.classList.toggle('ativo', link.getAttribute('href') === '#' + id);
    });
}

links.forEach(link => {
    link.addEventListener('click', evento => {
        evento.preventDefault();
        const id = link.getAttribute('href').slice(1);
        mostrarPagina(id);
        history.replaceState(null, '', '#' + id);
    });
});

mostrarPagina(location.hash.slice(1));


// tema claro / escuro
// ======================================================
const botaoTema = document.getElementById('botao-tema');

function aplicarTema(tema) {
    const claro = tema === 'claro';
    document.body.classList.toggle('tema-claro', claro);
    botaoTema.textContent = claro ? 'Tema escuro' : 'Tema claro';
}

function lerTema() {
    try {
        return localStorage.getItem('tema') || 'escuro';
    } catch {
        return 'escuro';
    }
}

function guardarTema(tema) {
    try {
        localStorage.setItem('tema', tema);
    } catch {
        // sem acesso ao localStorage (ex.: navegação privada), o tema só não fica guardado
    }
}

botaoTema.addEventListener('click', () => {
    const novoTema = document.body.classList.contains('tema-claro') ? 'escuro' : 'claro';
    aplicarTema(novoTema);
    guardarTema(novoTema);
});

aplicarTema(lerTema());


// arranque
// ======================================================
const perfil = await carregarPerfil();
mostrarNome(perfil.nome);
document.body.classList.remove('a-carregar');

iniciarDefinicoes(utilizador, perfil, mostrarNome);
await iniciarCategorias();
iniciarMovimentos();
iniciarResumo();
iniciarGrafico();
await Promise.all([iniciarTarefas(), iniciarAgenda()]);
iniciarCalendario();
iniciarDashboard();
iniciarWidgets();
iniciarNotificacoes();
iniciarTempoReal(utilizador);
