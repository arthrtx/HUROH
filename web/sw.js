const VERSAO = 'huroh-v1';

const FICHEIROS = [
    './',
    './index.html',
    './login.html',
    './manifest.json',
    './css/base.css',
    './css/formularios.css',
    './css/paginas.css',
    './css/login.css',
    './js/app.js',
    './js/auth.js',
    './js/supabase.js',
    './js/utils.js',
    './js/definicoes.js',
    './js/categorias.js',
    './js/movimentos.js',
    './js/resumo.js',
    './js/grafico.js',
    './js/tarefas.js',
    './js/agenda.js',
    './js/calendario.js',
    './js/dashboard.js',
    './js/tempo-real.js',
    './js/widgets.js',
    './js/notificacoes.js',
    './assets/icones/icone-192.png',
    './assets/icones/icone-512.png',
];

self.addEventListener('install', evento => {
    evento.waitUntil(caches.open(VERSAO).then(cache => cache.addAll(FICHEIROS)));
    self.skipWaiting();
});

self.addEventListener('activate', evento => {
    evento.waitUntil(
        caches.keys().then(chaves =>
            Promise.all(chaves.filter(chave => chave !== VERSAO).map(chave => caches.delete(chave)))
        )
    );
    self.clients.claim();
});

// ficheiros da app: tenta a rede primeiro (para ver sempre a versão nova) e usa a cache se estiver offline
// os dados do Supabase nunca passam pela cache
self.addEventListener('fetch', evento => {
    const pedido = evento.request;
    const url = new URL(pedido.url);

    if (pedido.method !== 'GET' || url.origin !== location.origin) {
        return;
    }

    evento.respondWith(
        fetch(pedido)
            .then(resposta => {
                const copia = resposta.clone();
                caches.open(VERSAO).then(cache => cache.put(pedido, copia));
                return resposta;
            })
            .catch(() => caches.match(pedido))
    );
});
