import { supabase } from './supabase.js';
import { TABELAS, aplicarDeFora, apagarBd, guardarMeta, lerFila, lerMeta, substituir, tirarDaFila, tudo } from './bd.js';
import { aviso, dataISO } from './utils.js';

const TEMPO_REAL = ['transactions', 'events', 'tasks'];
const INTERVALO = 10 * 60 * 1000;

let utilizador;
let aSincronizar = false;
let deNovo = null;
let ultimaVez = 0;
let leve = null;


// enviar o que está na fila
// ======================================================
// só estes erros querem dizer "os dados não são aceites"; o resto (rede, sessão) tenta-se mais tarde
function recusado(erro) {
    return /^(22|23)/.test(erro.code || '') || erro.code === '42501';
}

function enviarItem(item) {
    return item.operacao === 'apagar'
        ? supabase.from(item.tabela).delete().eq('id', item.linha.id)
        : supabase.from(item.tabela).upsert(item.linha);
}

async function enviar() {
    for (const item of await lerFila()) {
        let { error } = await enviarItem(item);

        // a categoria foi apagada noutro dispositivo: o movimento vai sem categoria
        if (error && recusado(error) && item.tabela === 'transactions' && item.linha.category_id) {
            ({ error } = await enviarItem({ ...item, linha: { ...item.linha, category_id: null } }));
        }

        if (error && !recusado(error)) return false;
        if (error && !leve) aviso('Uma alteração não foi aceite pelo servidor e foi desfeita.', 'erro');

        await tirarDaFila(item);
    }
    return true;
}


// receber tudo
// ======================================================
async function receber() {
    for (const tabela of TABELAS) {
        const { data, error } = await supabase.from(tabela).select('*');
        if (error) return false;
        await substituir(tabela, data);
    }
    ultimaVez = Date.now();
    await guardarMeta('ultima-sincronizacao', new Date().toISOString());
    return true;
}

export async function sincronizar(tudoDeNovo = true) {
    if (!navigator.onLine) return;
    if (aSincronizar) {
        deNovo = deNovo || tudoDeNovo;
        return;
    }

    aSincronizar = true;
    try {
        const enviado = await enviar();
        if (enviado && tudoDeNovo) await receber();
    } finally {
        aSincronizar = false;
    }

    if (deNovo !== null) {
        const tudoOutraVez = deNovo;
        deNovo = null;
        await sincronizar(tudoOutraVez);
    }
}


// alterações feitas noutro dispositivo
// ======================================================
function ligarTempoReal(nome = 'huroh-') {
    const canal = supabase.channel(nome + utilizador.id);

    TEMPO_REAL.forEach(tabela => {
        canal.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: tabela, filter: `user_id=eq.${utilizador.id}` },
            mudanca => {
                const apagada = mudanca.eventType === 'DELETE';
                aplicarDeFora(tabela, apagada ? mudanca.old : mudanca.new, apagada);
            }
        );
    });

    canal.subscribe();
    return canal;
}


// menu lateral sozinho (ao ligar o computador, antes de abrir a janela)
// ======================================================
// leve: envia o que ficou pendente e recebe ao começar, em tempo real e de 15 em 15 minutos; para quando a janela abre
export function sincronizacaoLeve(dono, ligada) {
    if (ligada === Boolean(leve)) return;

    if (!ligada) {
        clearInterval(leve.intervalo);
        window.removeEventListener('online', leve.online);
        supabase.removeChannel(leve.canal);
        leve = null;
        return;
    }

    utilizador = dono;
    const online = () => sincronizar();
    window.addEventListener('online', online);
    leve = { online, intervalo: setInterval(online, 15 * 60 * 1000), canal: ligarTempoReal('huroh-lateral-') };
    sincronizar();
}

// ao abrir o menu: se os dados já têm uns minutos, vai buscar o que mudou
export function sincronizarSeAntigo() {
    if (leve && Date.now() - ultimaVez > 2 * 60 * 1000) sincronizar();
}


// backup diário (só na app de computador)
// ======================================================
async function backupDoDia() {
    if (!window.huroh?.guardarBackup) return;

    const hoje = dataISO();
    if (await lerMeta('ultimo-backup') === hoje) return;

    const conteudo = {
        app: 'HUROH',
        versao: 1,
        criado: new Date().toISOString(),
        conta: { id: utilizador.id, email: utilizador.email },
        tabelas: await tudo(),
    };

    const ok = await window.huroh.guardarBackup(hoje, JSON.stringify(conteudo, null, 2));
    if (ok) await guardarMeta('ultimo-backup', hoje);
}


// terminar sessão: os dados deste utilizador saem do PC (os backups ficam)
// ======================================================
export async function terminarSessao() {
    await sincronizar(false);

    const porEnviar = (await lerFila()).length;
    if (porEnviar && !confirm(`Há ${porEnviar} alteração(ões) que ainda não chegaram à nuvem e vão perder-se. Sair mesmo assim?`)) {
        return;
    }

    try {
        if (utilizador) {
            localStorage.removeItem('perfil-' + utilizador.id);
            // sem isto, quem voltar a entrar não vê o tutorial outra vez
            localStorage.removeItem('tutorial-' + utilizador.id);
        }
    } catch {}

    await apagarBd();
    await supabase.auth.signOut();
    location.replace('login.html');
}


// apagar a conta: tudo sai da nuvem e deste dispositivo
// ======================================================
export async function apagarConta(apagarBackups) {
    if (!navigator.onLine) throw new Error('sem-internet');

    await supabase.storage.from('avatars').remove([`${utilizador.id}/avatar.jpg`]);

    const { error } = await supabase.rpc('apagar_conta');
    if (error) throw error;

    try {
        localStorage.removeItem('perfil-' + utilizador.id);
        localStorage.removeItem('tutorial-' + utilizador.id);
    } catch {}

    await apagarBd();
    if (apagarBackups) await window.huroh?.apagarBackups?.();
    await supabase.auth.signOut({ scope: 'local' });
    location.replace('login.html#conta-apagada');
}


// início
// ======================================================
export async function iniciarSincronizacao(dono) {
    utilizador = dono;

    document.addEventListener('fila-alterada', () => sincronizar(false));
    window.addEventListener('online', () => sincronizar());
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && Date.now() - ultimaVez > 2 * 60 * 1000) sincronizar();
    });

    setInterval(() => sincronizar(), INTERVALO);
    setInterval(backupDoDia, 60 * 60 * 1000);

    // a rede e o backup esperam um pouco, para a abertura ficar leve
    setTimeout(() => {
        ligarTempoReal();
        sincronizar();
    }, 1500);
    setTimeout(backupDoDia, 8000);
}
