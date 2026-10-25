import { supabase } from './supabase.js';
import { aviso, escapar } from './utils.js';
import { reduzirImagem } from './definicoes.js';

let utilizador;
let perfil = { nome: '', avatar: null };

export function perfilAtual() {
    return perfil;
}


function avatarIniciais(nome) {
    const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
        <rect width="80" height="80" fill="#16161b"/>
        <text x="40" y="50" font-family="Inter, sans-serif" font-size="30" font-weight="800" fill="#f4f4f5" text-anchor="middle">${escapar(iniciais)}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function avisarOutrasJanelas() {
    try {
        localStorage.setItem('perfil-atualizado', String(Date.now()));
    } catch {}
}

function mostrarPerfil() {
    const foto = perfil.avatar || avatarIniciais(perfil.nome);

    ['avatar-topo', 'avatar-painel', 'avatar-grande'].forEach(id => {
        document.getElementById(id).src = foto;
    });

    document.getElementById('nome-utilizador').textContent = perfil.nome.split(' ')[0];
    document.getElementById('perfil-nome-topo').textContent = perfil.nome;
    document.getElementById('perfil-nome-painel').textContent = perfil.nome;
    const titular = document.getElementById('cc-titular');
    if (titular) titular.textContent = perfil.nome.toUpperCase();
    document.getElementById('perfil-email-painel').textContent = utilizador.email;
}


// carregar e guardar
// ======================================================
export async function carregarPerfil(dono) {
    utilizador = dono;

    const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', utilizador.id)
        .single();

    perfil = {
        nome: data?.display_name || utilizador.email.split('@')[0],
        avatar: data?.avatar_url || null,
    };

    mostrarPerfil();
    return perfil;
}

export async function guardarNome(nome) {
    const { error } = await supabase.from('profiles').update({ display_name: nome }).eq('id', utilizador.id);

    if (error) return false;

    perfil.nome = nome;
    mostrarPerfil();
    avisarOutrasJanelas();
    return true;
}

async function mudarFoto(ficheiro) {
    const dataUrl = await reduzirImagem(ficheiro, 400);
    const blob = await (await fetch(dataUrl)).blob();
    const caminho = `${utilizador.id}/avatar.jpg`;

    const { error } = await supabase.storage
        .from('avatars')
        .upload(caminho, blob, { upsert: true, contentType: 'image/jpeg' });

    if (error) throw error;

    const { data } = supabase.storage.from('avatars').getPublicUrl(caminho);
    const url = `${data.publicUrl}?v=${Date.now()}`;

    const { error: erroPerfil } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', utilizador.id);
    if (erroPerfil) throw erroPerfil;
    perfil.avatar = url;
    mostrarPerfil();
    avisarOutrasJanelas();
}


// início
// ======================================================
export function iniciarPerfil() {
    const campo = document.getElementById('escolher-avatar');

    campo.addEventListener('change', async () => {
        const ficheiro = campo.files[0];
        if (!ficheiro) return;

        try {
            await mudarFoto(ficheiro);
            aviso('Foto atualizada.');
        } catch (erro) {
            console.error('Erro ao mudar a foto:', erro?.message || erro);
            aviso('Não foi possível mudar a foto.', 'erro');
        }

        campo.value = '';
    });
}
