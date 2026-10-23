// formatação
// ======================================================
const formatoEuros = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

export function euros(valor) {
    return formatoEuros.format(Number(valor) || 0);
}

export function dataCurta(data) {
    return new Date(data).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
}

export function hora(data) {
    return new Date(data).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export function escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto ?? '';
    return div.innerHTML;
}


// datas
// ======================================================
export function dataISO(data = new Date()) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

export function intervaloDoMes(data = new Date()) {
    const inicio = new Date(data.getFullYear(), data.getMonth(), 1);
    const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    return { inicio: dataISO(inicio), fim: dataISO(fim) };
}

export function paraInputDataHora(data) {
    if (!data) {
        return '';
    }
    const d = new Date(data);
    return `${dataISO(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}


// avisos
// ======================================================
export function aviso(texto, tipo = 'ok') {
    const caixa = document.createElement('div');
    caixa.className = `aviso aviso-${tipo}`;
    caixa.textContent = texto;
    document.body.appendChild(caixa);
    setTimeout(() => caixa.classList.add('visivel'), 10);
    setTimeout(() => {
        caixa.classList.remove('visivel');
        setTimeout(() => caixa.remove(), 300);
    }, 3000);
}
