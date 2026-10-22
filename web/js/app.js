const relogioHora = document.getElementById('relogio-hora');
const relogioData = document.getElementById('relogio-data');

function atualizarRelogio(){
    const agora = new Date();
    relogioHora.textContent = agora.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit'});
    relogioData.textContent = agora.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long'});
}

atualizarRelogio();
setInterval(atualizarRelogio, 1000);
