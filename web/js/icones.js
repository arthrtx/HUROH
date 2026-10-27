const CAMINHOS = {
    dashboard: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    financas: '<rect x="2.5" y="5" width="19" height="14" rx="3"/><path d="M2.5 10h19M7 15h3"/>',
    agenda: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    tarefas: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="m3.5 6.5 1.2 1.2L7 5.4M3.5 12l1.2 1.2L7 10.9M3.5 17.5l1.2 1.2L7 16.4"/>',
    widgets: '<rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/>',
    definicoes: '<path d="M19.25 10.53 L21.52 10.76 L21.52 13.24 L19.25 13.47 L18.17 16.09 L19.61 17.85 L17.85 19.61 L16.09 18.17 L13.47 19.25 L13.24 21.52 L10.76 21.52 L10.53 19.25 L7.91 18.17 L6.15 19.61 L4.39 17.85 L5.83 16.09 L4.75 13.47 L2.48 13.24 L2.48 10.76 L4.75 10.53 L5.83 7.91 L4.39 6.15 L6.15 4.39 L7.91 5.83 L10.53 4.75 L10.76 2.48 L13.24 2.48 L13.47 4.75 L16.09 5.83 L17.85 4.39 L19.61 6.15 L18.17 7.91 Z"/><circle cx="12" cy="12" r="3"/>',
    lua: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    sair: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/>',
    sino: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/>',
    pesquisa: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    seta: '<path d="m7 17 10-10M9 7h8v8"/>',
    baixo: '<path d="m6 9 6 6 6-6"/>',
    entrada: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6"/><path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"/>',
    saida: '<path d="M5.5 8h13l-1.2 12.2a1 1 0 0 1-1 .8H7.7a1 1 0 0 1-1-.8z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    aviso: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
    visto: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    utilizador: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'seta-mapa': '<path d="M20 4 4 10.5l7 2.5 2.5 7z"/>',
    fechar: '<path d="M6 6l12 12M18 6 6 18"/>',
    lateral: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M5.5 8h1M5.5 11h1M5.5 14h1"/>',
    camara: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
};

export function icone(nome, classe = 'icone') {
    return `<svg class="${classe}" viewBox="0 0 24 24" aria-hidden="true">${CAMINHOS[nome] || ''}</svg>`;
}
