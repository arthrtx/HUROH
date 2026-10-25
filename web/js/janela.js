document.querySelectorAll('[data-janela]').forEach(botao => {
    botao.addEventListener('click', () => window.huroh?.janela?.(botao.dataset.janela));
});
