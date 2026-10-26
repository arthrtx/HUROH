export const TABELAS = ['categories', 'transactions', 'events', 'tasks'];

let bd = null;
let dono = null;
let ordem = Date.now();
const canal = 'BroadcastChannel' in window ? new BroadcastChannel('huroh-dados') : null;


// abrir
// ======================================================
export function apagarBd() {
    if (!bd) return Promise.resolve();
    const nome = bd.name;
    bd.close();
    bd = null;
    return new Promise(resolver => {
        const pedido = indexedDB.deleteDatabase(nome);
        pedido.onsuccess = pedido.onerror = pedido.onblocked = () => resolver();
    });
}

export function abrirBd(utilizador) {
    dono = utilizador;

    return new Promise((resolver, rejeitar) => {
        const pedido = indexedDB.open('huroh-' + utilizador.id, 1);

        pedido.onupgradeneeded = () => {
            const base = pedido.result;
            TABELAS.forEach(tabela => base.createObjectStore(tabela, { keyPath: 'id' }));
            base.createObjectStore('fila', { keyPath: 'chave' });
            base.createObjectStore('meta');
        };

        pedido.onsuccess = () => {
            bd = pedido.result;
            // outra janela está a apagar os dados (terminar sessão): larga a ligação
            bd.onversionchange = () => bd.close();
            resolver();
        };

        pedido.onerror = () => rejeitar(pedido.error);
    });
}

function pedir(loja, modo, acao) {
    return new Promise((resolver, rejeitar) => {
        const transacao = bd.transaction(loja, modo);
        let resultado;
        const pedido = acao(transacao.objectStore(loja));
        if (pedido) pedido.onsuccess = () => { resultado = pedido.result; };
        transacao.oncomplete = () => resolver(resultado);
        transacao.onerror = () => rejeitar(transacao.error);
    });
}


// avisar a app (e as outras janelas) que algo mudou
// ======================================================
export function avisarMudanca(tabela, deOutraJanela = false) {
    document.dispatchEvent(new CustomEvent('dados-alterados', { detail: tabela }));
    if (!deOutraJanela) canal?.postMessage(tabela);
}

canal?.addEventListener('message', evento => avisarMudanca(evento.data, true));


// ler
// ======================================================
export function listar(tabela) {
    return pedir(tabela, 'readonly', loja => loja.getAll());
}

export function obter(tabela, id) {
    return pedir(tabela, 'readonly', loja => loja.get(id));
}

export function lerMeta(chave) {
    return pedir('meta', 'readonly', loja => loja.get(chave));
}

export function guardarMeta(chave, valor) {
    return pedir('meta', 'readwrite', loja => { loja.put(valor, chave); });
}


// escrever (fica logo no PC e entra na fila para o Supabase)
// ======================================================
async function porNaFila(tabela, operacao, linha) {
    const chave = `${tabela}:${linha.id}`;
    const antiga = await pedir('fila', 'readonly', loja => loja.get(chave));
    const posicao = operacao === 'guardar' && antiga ? antiga.ordem : ++ordem;
    await pedir('fila', 'readwrite', loja => { loja.put({ chave, tabela, operacao, linha, ordem: posicao }); });
}

export async function guardar(tabela, id, dados) {
    const antiga = id ? await obter(tabela, id) : null;
    const linha = antiga
        ? { ...antiga, ...dados }
        : { id: crypto.randomUUID(), user_id: dono.id, created_at: new Date().toISOString(), ...dados };

    await pedir(tabela, 'readwrite', loja => { loja.put(linha); });
    await porNaFila(tabela, 'guardar', linha);
    avisarMudanca(tabela);
    document.dispatchEvent(new CustomEvent('fila-alterada'));
    return linha;
}

export async function apagar(tabela, id) {
    await pedir(tabela, 'readwrite', loja => { loja.delete(id); });

    // no Supabase os movimentos ficam sem categoria; aqui faz-se o mesmo
    if (tabela === 'categories') {
        const movimentos = (await listar('transactions')).filter(m => m.category_id === id);
        for (const movimento of movimentos) {
            movimento.category_id = null;
            await pedir('transactions', 'readwrite', loja => { loja.put(movimento); });
            const pendente = await pedir('fila', 'readonly', loja => loja.get(`transactions:${movimento.id}`));
            if (pendente) await porNaFila('transactions', pendente.operacao, movimento);
        }
        if (movimentos.length) avisarMudanca('transactions');
    }

    await porNaFila(tabela, 'apagar', { id });
    avisarMudanca(tabela);
    document.dispatchEvent(new CustomEvent('fila-alterada'));
}


// fila de envio
// ======================================================
export async function lerFila() {
    const fila = await pedir('fila', 'readonly', loja => loja.getAll());
    return fila.sort((a, b) => a.ordem - b.ordem);
}

export function tirarDaFila(item) {
    // só sai se não tiver mudado entretanto
    return pedir('fila', 'readwrite', loja => {
        const pedido = loja.get(item.chave);
        pedido.onsuccess = () => {
            if (pedido.result && JSON.stringify(pedido.result) === JSON.stringify(item)) loja.delete(item.chave);
        };
    });
}


// receber do Supabase (o que está na fila não é tocado)
// ======================================================
export async function substituir(tabela, linhas) {
    const pendentes = new Set((await lerFila()).filter(f => f.tabela === tabela).map(f => f.linha.id));
    const atuais = await listar(tabela);
    const porId = new Map(atuais.map(l => [l.id, l]));
    let mudou = false;

    await pedir(tabela, 'readwrite', loja => {
        const novas = new Set();
        linhas.forEach(linha => {
            novas.add(linha.id);
            if (pendentes.has(linha.id)) return;
            if (JSON.stringify(porId.get(linha.id)) !== JSON.stringify(linha)) {
                loja.put(linha);
                mudou = true;
            }
        });
        atuais.forEach(linha => {
            if (!novas.has(linha.id) && !pendentes.has(linha.id)) {
                loja.delete(linha.id);
                mudou = true;
            }
        });
    });

    if (mudou) avisarMudanca(tabela);
}

export async function aplicarDeFora(tabela, linha, apagada) {
    const pendente = await pedir('fila', 'readonly', loja => loja.get(`${tabela}:${linha.id}`));
    if (pendente) return;

    await pedir(tabela, 'readwrite', loja => {
        if (apagada) loja.delete(linha.id);
        else loja.put(linha);
    });
    avisarMudanca(tabela);
}


// contas do mês (antes eram funções no Supabase)
// ======================================================
export async function resumoFinanceiro(inicio, fim) {
    const movimentos = (await listar('transactions')).filter(m =>
        (!inicio || m.transaction_date >= inicio) && (!fim || m.transaction_date <= fim));

    let rendimentos = 0;
    let despesas = 0;
    movimentos.forEach(m => {
        const centimos = Math.round(Number(m.amount) * 100);
        if (m.type === 'income') rendimentos += centimos;
        else despesas += centimos;
    });

    return { rendimentos: rendimentos / 100, despesas: despesas / 100, saldo: (rendimentos - despesas) / 100 };
}

export async function despesasPorCategoria(inicio, fim) {
    const [movimentos, categorias] = await Promise.all([listar('transactions'), listar('categories')]);
    const totais = new Map();

    movimentos
        .filter(m => m.type === 'expense' && m.transaction_date >= inicio && m.transaction_date <= fim)
        .forEach(m => {
            const chave = m.category_id || null;
            totais.set(chave, (totais.get(chave) || 0) + Math.round(Number(m.amount) * 100));
        });

    return [...totais.entries()]
        .map(([id, centimos]) => {
            const categoria = categorias.find(c => c.id === id);
            return {
                category_id: id,
                nome: categoria?.name || 'Sem categoria',
                cor: categoria?.color || '#8b8b93',
                total: centimos / 100,
                limite: categoria?.monthly_limit ?? null,
            };
        })
        .sort((a, b) => b.total - a.total);
}


// tudo junto (para o backup)
// ======================================================
export async function tudo() {
    const tabelas = {};
    for (const tabela of TABELAS) tabelas[tabela] = await listar(tabela);
    return tabelas;
}
