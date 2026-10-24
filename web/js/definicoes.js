import { supabase } from './supabase.js';
import { aviso } from './utils.js';

export function iniciarDefinicoes(utilizador, perfil, aoMudarNome) {
    const form = document.getElementById('form-perfil');
    form.nome.value = perfil.nome;
    document.getElementById('perfil-email').value = utilizador.email;

    form.addEventListener('submit', async evento => {
        evento.preventDefault();
        const nome = form.nome.value.trim();

        const { error } = await supabase
            .from('profiles')
            .update({ display_name: nome })
            .eq('id', utilizador.id);

        if (error) {
            aviso('Não foi possível guardar o nome.', 'erro');
            return;
        }

        aoMudarNome(nome);
        aviso('Perfil guardado.');
    });

    document.getElementById('botao-sair').addEventListener('click', async () => {
        await supabase.auth.signOut();
        location.replace('login.html');
    });
}
