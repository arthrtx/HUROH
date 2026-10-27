// carrossel das funcionalidades
// ======================================================
const faixa = document.getElementById('faixa');

if (faixa) {
    const slides = [...faixa.querySelectorAll('.slide')];
    const pontos = document.getElementById('pontos');
    let atual = 0;

    pontos.innerHTML = slides.map((_, i) => `<button type="button" aria-label="${i + 1}"></button>`).join('');
    const botoes = [...pontos.children];

    function irPara(i) {
        const slide = slides[Math.max(0, Math.min(slides.length - 1, i))];
        faixa.scrollTo({ left: slide.offsetLeft - (faixa.clientWidth - slide.offsetWidth) / 2 });
    }

    function marcar() {
        const meio = faixa.scrollLeft + faixa.clientWidth / 2;
        let perto = 0;
        slides.forEach((s, i) => {
            if (Math.abs(s.offsetLeft + s.offsetWidth / 2 - meio) < Math.abs(slides[perto].offsetLeft + slides[perto].offsetWidth / 2 - meio)) perto = i;
        });
        atual = perto;
        slides.forEach((s, i) => s.classList.toggle('atual', i === atual));
        botoes.forEach((b, i) => b.classList.toggle('ativo', i === atual));
    }

    document.querySelector('.seta-esq').addEventListener('click', () => irPara(atual - 1));
    document.querySelector('.seta-dir').addEventListener('click', () => irPara(atual + 1));
    botoes.forEach((b, i) => b.addEventListener('click', () => irPara(i)));
    slides.forEach((s, i) => s.addEventListener('click', () => { if (i !== atual) irPara(i); }));

    let espera;
    faixa.addEventListener('scroll', () => {
        clearTimeout(espera);
        espera = setTimeout(marcar, 60);
    }, { passive: true });
    window.addEventListener('resize', () => irPara(atual));

    marcar();
}
