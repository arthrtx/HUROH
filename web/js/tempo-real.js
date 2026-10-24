import { supabase } from './supabase.js';

const TABELAS = ['transactions', 'events', 'tasks'];


// alterações feitas noutro dispositivo chegam aqui sem recarregar
// ======================================================
export function iniciarTempoReal(utilizador) {
    const canal = supabase.channel('huroh-' + utilizador.id);

    TABELAS.forEach(tabela => {
        canal.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tabela, filter: `user_id=eq.${utilizador.id}` },
            () => avisar(tabela)
        );
    });

    canal.subscribe();

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            TABELAS.forEach(avisar);
        }
    });
}

// junta várias alterações seguidas numa só atualização
const pendentes = new Map();

function avisar(tabela) {
    clearTimeout(pendentes.get(tabela));
    pendentes.set(tabela, setTimeout(() => {
        document.dispatchEvent(new CustomEvent('dados-alterados', { detail: tabela }));
    }, 300));
}
