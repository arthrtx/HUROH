import { createClient } from './vendor/supabase.js';

const SUPABASE_URL = 'https://mkcqjgvradohwlkunepi.supabase.co';
const SUPABASE_CHAVE = 'sb_publishable_-_jVeqsuKsR17jjfNw1kxg_UTsp-cCq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE);

function sessaoGuardada() {
    try {
        return JSON.parse(localStorage.getItem(supabase.auth.storageKey));
    } catch {
        return null;
    }
}

// os dados estão no PC, por isso a app abre logo com a sessão guardada; o Supabase renova-a por trás
// (se a sessão já não for válida, chega um SIGNED_OUT e volta-se ao login)
export async function obterSessao() {
    const guardada = sessaoGuardada();
    if (guardada?.user?.id && guardada.refresh_token) {
        supabase.auth.getSession();
        return guardada;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (session || !error) return session;
    return sessaoGuardada();
}
