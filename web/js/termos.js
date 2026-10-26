const VERSAO_TERMOS = '4';

const TEXTO = `
    <h3>1. O que é a HUROH</h3>
    <p>A HUROH é uma aplicação pessoal para organizar finanças, agenda e tarefas. Serve apenas para registo e organização: não é um banco, não movimenta dinheiro e não dá aconselhamento financeiro.</p>

    <h3>2. A tua conta</h3>
    <p>Para usar a HUROH precisas de uma conta Google: a conta HUROH é criada quando entras com o Google pela primeira vez. A HUROH não cria nem guarda palavras-passe; a segurança do acesso (palavra-passe, verificação em dois passos) é gerida pelo Google e é da tua responsabilidade, tal como a informação que registas. Deves ter pelo menos 16 anos ou autorização de quem tem a tua responsabilidade parental.</p>

    <h3>3. Que dados guardamos</h3>
    <p>Conta: o nome, o email e a foto da tua conta Google (podes mudar o nome e a foto na aplicação). Nunca temos acesso à tua palavra-passe do Google, ao Gmail nem aos teus contactos.</p>
    <p>O que registas: movimentos, categorias, eventos, tarefas e preferências da aplicação.</p>
    <p>Não recolhemos localização, contactos, publicidade nem estatísticas de utilização.</p>

    <h3>4. Para que usamos os dados</h3>
    <p>Só para a aplicação funcionar: criar e identificar a tua conta e guardar e sincronizar a tua informação entre os teus dispositivos. A base legal é a execução deste contrato, ou seja, prestar-te o serviço que pediste (RGPD, artigo 6.º, n.º 1, alínea b; LGPD, artigo 7.º, inciso V). Não usamos os dados para publicidade, não os vendemos, não criamos perfis e não tomamos decisões automáticas sobre ti.</p>

    <h3>5. Onde ficam guardados</h3>
    <p>Na nuvem: no Supabase, em servidores na União Europeia (Irlanda). Cada conta só consegue ver os seus próprios dados.</p>
    <p>No teu computador: uma cópia local para a aplicação abrir rápido e funcionar sem internet, e um backup diário em Documentos\HUROH\backups (ficam os últimos 14). Ao terminar sessão, a cópia local é apagada; os backups ficam no teu PC e só tu os controlas.</p>

    <h3>6. Com quem partilhamos</h3>
    <p>Com ninguém, exceto os serviços técnicos necessários, que tratam os dados só em nosso nome: o Supabase (alojamento das contas e dos dados) e o Google (para entrares na tua conta). Os teus dados só são entregues a autoridades quando a lei o obrigar.</p>

    <h3>7. Segurança</h3>
    <p>As ligações são cifradas (HTTPS) e o acesso aos dados está limitado à tua conta. A segurança do teu computador e da tua palavra-passe também depende de ti. Se houver uma violação de dados que te possa afetar, avisamos-te e às autoridades nos prazos da lei.</p>

    <h3>8. Durante quanto tempo</h3>
    <p>Guardamos os dados enquanto a tua conta existir. Podes apagar a conta a qualquer momento em Definições → Apagar conta: a conta e todos os dados são apagados de imediato dos nossos servidores e deste dispositivo e, se escolheres, também os backups do teu computador. Não guardamos cópias. Podem restar cópias técnicas do serviço de alojamento, que são eliminadas automaticamente em até 30 dias.</p>

    <h3>9. Os teus direitos (RGPD e LGPD)</h3>
    <p>Podes, a qualquer momento e sem custos: saber que dados temos sobre ti, corrigi-los, apagá-los (em Definições → Apagar conta), levar uma cópia (em Definições → Exportar dados), limitar ou opor-te ao tratamento e retirar o consentimento. Para outros pedidos escreve para huroh@outlook.pt; respondemos no prazo de 30 dias. Podes também apresentar reclamação à CNPD (Portugal) ou à ANPD (Brasil).</p>

    <h3>10. Uso aceitável</h3>
    <p>Não uses a HUROH para atividades ilegais nem tentes aceder a dados de outras pessoas.</p>

    <h3>11. Disponibilidade</h3>
    <p>A HUROH é gratuita e fornecida «tal como está» e «conforme disponível», sem garantias de qualquer tipo. Pode ter erros, falhas ou interrupções, e funcionalidades podem mudar ou deixar de existir. Podemos suspender ou terminar o serviço, ou uma conta que não cumpra estes termos; sempre que possível avisamos antes, para que possas exportar os teus dados.</p>

    <h3>12. As tuas responsabilidades</h3>
    <p>És responsável pela exatidão do que registas, por manter cópias do que for importante (podes exportar a qualquer momento) e pela segurança do teu dispositivo e da tua conta. A HUROH é para uso pessoal: não substitui contabilidade, declarações fiscais nem registos oficiais.</p>

    <h3>13. Limitação de responsabilidade</h3>
    <p>Na medida máxima permitida por lei, não somos responsáveis por perdas de dados, perdas financeiras, decisões tomadas com base na informação da aplicação, erros de cálculo, lembretes que não cheguem, interrupções do serviço nem por quaisquer danos indiretos resultantes do uso ou da impossibilidade de usar a HUROH. Os valores e resumos mostrados são apenas indicativos. Nada nestes termos exclui responsabilidades que a lei não permita excluir.</p>

    <h3>14. Serviços de terceiros</h3>
    <p>Entrar com o Google e o alojamento dos dados dependem de serviços de terceiros (Google e Supabase), com os seus próprios termos. Não somos responsáveis pelo funcionamento desses serviços.</p>

    <h3>15. Alterações</h3>
    <p>Estes termos podem ser atualizados. Quando isso acontecer, pedimos-te que os aceites de novo.</p>

    <h3>16. Lei aplicável</h3>
    <p>Estes termos regem-se pela lei portuguesa. Se fores consumidor noutro país, mantens os direitos que a lei desse país te dá.</p>

    <h3>17. Contacto</h3>
    <p>Para qualquer questão sobre estes termos ou sobre os teus dados: huroh@outlook.pt.</p>
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
