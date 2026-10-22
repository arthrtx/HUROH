const relogioHora = document.getElementById('relogio-hora');
const relogioData = document.getElementById('relogio-data');

function atualizarRelogio(){
    const agora = new Date();
    relogioHora.textContent = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit'});
    relogioData.textContent = agora.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long'});
}

atualizarRelogio();
setInterval(atualizarRelogio, 1000);

const links = document.querySelectorAll('.menu nav a');
const paginas = document.querySelectorAll('.pagina');

function mostrarPagina(id) {
    const existe = Array.from(paginas).some(pagina => pagina.id === id);
    if (!existe) {
        id = 'dashboard';
    }

    paginas.forEach(pagina => {
        pagina.classList.toggle('ativa', pagina.id === id);
    });

    links.forEach(link => {
        link.classList.toggle('ativo', link.getAttribute('href') === '#' + id);
    });
}

links.forEach(link => {
    link.addEventListener('click', evento => {
        evento.preventDefault();
        const id = link.getAttribute('href').slice(1);
        mostrarPagina(id);
        history.replaceState(null, '', '#' + id);
    });
});

mostrarPagina(location.hash.slice(1));
