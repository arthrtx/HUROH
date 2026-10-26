document.querySelectorAll('[data-janela]').forEach(botao => {
    botao.addEventListener('click', () => window.huroh?.janela?.(botao.dataset.janela));
});


// Esc minimiza (se não houver nada aberto para fechar primeiro)
// ======================================================
function haAlgoAberto() {
    return Boolean(
        document.querySelector('dialog[open], .painel:not(.escondido)') ||
        document.body.classList.contains('pesquisa-aberta')
    );
}

// corre antes dos outros atalhos, para saber o estado antes de fecharem alguma coisa
window.addEventListener('keydown', evento => {
    if (evento.key !== 'Escape' || evento.repeat || !window.huroh?.janela) return;
    if (location.pathname.endsWith('login.html')) return;

    const campo = evento.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if (campo && !campo.closest('dialog')) {
        campo.blur();
        return;
    }

    if (haAlgoAberto()) return;
    window.huroh.janela('minimizar');
}, true);
