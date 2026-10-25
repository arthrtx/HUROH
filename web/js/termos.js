const VERSAO_TERMOS = '1';

const TEXTO = `
    <h3>1. O que é a HUROH</h3>
    <p>A HUROH é uma aplicação pessoal para organizar finanças, agenda e tarefas. Serve apenas para registo e organização: não é um banco, não movimenta dinheiro e não dá aconselhamento financeiro.</p>

    <h3>2. A tua conta</h3>
    <p>Para usar a HUROH precisas de uma conta com email e palavra-passe. És responsável por manter a palavra-passe em segredo e pela informação que registas.</p>

    <h3>3. Os teus dados</h3>
    <p>Guardamos apenas o que introduzes (nome, email, foto, movimentos, eventos, tarefas e preferências) para que a aplicação funcione e fique igual nos teus dispositivos. Cada conta só tem acesso aos seus próprios dados. Não vendemos nem partilhamos os teus dados com terceiros, exceto os serviços técnicos necessários para guardar a informação.</p>

    <h3>4. Apagar a conta</h3>
    <p>Podes pedir para apagar a tua conta e todos os dados associados a qualquer momento.</p>

    <h3>5. Uso aceitável</h3>
    <p>Não uses a HUROH para atividades ilegais nem tentes aceder a dados de outras pessoas.</p>

    <h3>6. Disponibilidade</h3>
    <p>A HUROH é fornecida tal como está. Fazemos o possível para que funcione sempre, mas podem existir falhas ou interrupções. Mantém cópias da informação que for importante para ti.</p>

    <h3>7. Alterações</h3>
    <p>Estes termos podem ser atualizados. Quando isso acontecer, pedimos-te que os aceites de novo.</p>
`;


// janela
// ======================================================
function janelaTermos(comAceitar) {
    let janela = document.getElementById('janela-termos');
    if (!janela) {
        janela = document.createElement('dialog');
        janela.id = 'janela-termos';
        janela.className = 'janela janela-termos';
        document.body.appendChild(janela);
    }

    janela.innerHTML = `
        <div class="termos-cabeca">
            <h2>Termos de Utilização</h2>
            ${comAceitar ? '' : '<button type="button" class="botao-link" data-fechar-termos>Fechar</button>'}
        </div>
        <div class="termos-texto">${TEXTO}</div>
        ${comAceitar ? `
            <label class="termos-aceitar">
                <input type="checkbox" id="termos-li" />
                <span>Li e aceito os Termos de Utilização</span>
            </label>
            <div class="janela-botoes">
                <button type="button" class="botao" data-recusar-termos>Sair</button>
                <button type="button" class="botao botao-principal" data-aceitar-termos disabled>Aceitar e continuar</button>
            </div>` : ''}
    `;
    return janela;
}

export function mostrarTermos() {
    const janela = janelaTermos(false);
    janela.querySelector('[data-fechar-termos]').addEventListener('click', () => janela.close());
    janela.showModal();
}

function termosAceites() {
    try {
        return localStorage.getItem('termos-aceites') === VERSAO_TERMOS;
    } catch {
        return false;
    }
}

export function guardarAceitacao() {
    try {
        localStorage.setItem('termos-aceites', VERSAO_TERMOS);
    } catch {}
}


// aceitar
// ======================================================
export function exigirTermos(aoRecusar) {
    if (termosAceites()) return Promise.resolve();

    return new Promise(resolver => {
        const janela = janelaTermos(true);
        const caixa = janela.querySelector('#termos-li');
        const aceitar = janela.querySelector('[data-aceitar-termos]');

        caixa.addEventListener('change', () => { aceitar.disabled = !caixa.checked; });
        janela.addEventListener('cancel', evento => evento.preventDefault());
        aceitar.addEventListener('click', () => {
            guardarAceitacao();
            janela.close();
            resolver();
        });
        janela.querySelector('[data-recusar-termos]').addEventListener('click', () => aoRecusar?.());

        janela.showModal();
    });
}
