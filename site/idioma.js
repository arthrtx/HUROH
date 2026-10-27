// idioma do site: português (o que está no HTML) ou inglês
// ======================================================
const INGLES = {
    'nav.video': 'Video',
    'nav.funcionalidades': 'Features',
    'nav.privacidade': 'Privacy',
    'nav.descarregar': 'Download',
    'nav.inicio': 'Home',
    'nav.termos': 'Terms',
    'heroi.etiqueta': 'Windows 10 and 11',
    'heroi.titulo': 'Your life, in sync.',
    'heroi.texto': 'HUROH brings finances, calendar and tasks together in one dashboard. It works offline and syncs when you are back online.',
    'botao.descarregar': 'Download for Windows',
    'botao.ver': 'Watch the video',
    'func.etiqueta': 'Features',
    'func.titulo': 'Everything in one place',
    's1.titulo': 'Dashboard',
    's1.texto': 'Your balance, the month, your calendar and your latest activity, right when you open it.',
    's1.a': 'Balance',
    's1.av': 'In real time',
    's1.b': 'Monthly summary',
    's1.bv': 'What came in, went out and is left',
    's2.titulo': 'Finances',
    's2.texto': 'Income and expenses, categories with a monthly limit and where your money goes.',
    's2.a': 'Categories',
    's2.av': 'With a monthly limit',
    's2.b': 'Filters',
    's2.bv': 'By month, type and category',
    's3.titulo': 'Calendar',
    's3.texto': 'Weekly or monthly view, national holidays and events with reminders.',
    's3.a': 'Views',
    's3.av': 'Weekly and monthly',
    's3.b': 'Reminders',
    's3.bv': 'Notifications on your PC',
    's4.titulo': 'Tasks',
    's4.texto': 'Organised by priority, with due dates and your progress for the day.',
    's4.a': 'Priorities',
    's4.av': 'High, medium and low',
    's4.b': 'Due dates',
    's4.bv': 'Overdue alerts',
    's5.titulo': 'Side menu',
    's5.texto': 'Move the mouse to the left edge of the screen to see your balance, your day and quick entries, without opening the window.',
    's5.a': 'Startup',
    's5.av': 'Opens with Windows',
    's5.b': 'Quick entry',
    's5.bv': 'Expense, income, task, event',
    's6.titulo': 'Light and dark',
    's6.texto': 'Two themes, three languages and automatic updates.',
    's6.a': 'Languages',
    's6.av': 'Portuguese, English and Spanish',
    's6.b': 'Updates',
    's6.bv': 'Automatic',
    'priv.titulo': 'Your data is yours',
    'priv.a.chip': 'Account',
    'priv.a.titulo': 'Sign in with Google',
    'priv.a.texto': 'No passwords stored by HUROH.',
    'priv.b.chip': 'Control',
    'priv.b.titulo': 'Export or delete',
    'priv.b.texto': 'Take a copy of everything, or delete your account and data whenever you want.',
    'priv.c.chip': 'Offline',
    'priv.c.titulo': 'Works offline',
    'priv.c.texto': 'Saves on your computer and syncs when you are back online.',
    'desc.etiqueta': 'Download',
    'desc.titulo': 'Get started',
    'desc.texto': 'For Windows 10 and 11. Installs without admin rights and updates itself.',
    'desc.versoes': 'All versions and release notes',
    'rod.privacidade': 'Privacy',
    'rod.termos': 'Terms',
    'rod.direitos': '© 2026 HUROH. All rights reserved.',
    'so-pt': 'This document is only available in Portuguese.',
};

const originais = new Map();

function aplicarIdioma(idioma) {
    document.documentElement.lang = idioma === 'en' ? 'en' : 'pt';
    document.querySelectorAll('[data-t]').forEach(el => {
        if (!originais.has(el)) originais.set(el, el.textContent);
        el.textContent = idioma === 'en' && INGLES[el.dataset.t] ? INGLES[el.dataset.t] : originais.get(el);
    });
    document.querySelectorAll('[data-idioma]').forEach(b => b.classList.toggle('ativo', b.dataset.idioma === idioma));
    try {
        localStorage.setItem('idioma-site', idioma);
    } catch {}
}

let idiomaInicial = 'pt';
try {
    idiomaInicial = localStorage.getItem('idioma-site') || (navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en');
} catch {}

document.querySelectorAll('[data-idioma]').forEach(b => b.addEventListener('click', () => aplicarIdioma(b.dataset.idioma)));
aplicarIdioma(idiomaInicial);
