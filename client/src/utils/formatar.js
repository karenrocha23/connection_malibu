//export const moeda = (valor) =>
//  Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// DATETIME do MySQL chega como "2026-10-05 14:30:00"
//export const dataHora = (iso) =>
//  new Date(iso.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// Aceita "49,90", "49.90" e "1.299,90". Retorna NaN se não for número.
//export function lerPreco(texto) {
//  const t = String(texto).trim().replace(/^R\$\s*/, '');
//  if (!t) return NaN;
//  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
//  return Number(normal);
//}

//export const precoParaCampo = (numero) => Number(numero).toFixed(2).replace('.', ',');

//export const dataCurta = (iso) => new Date(iso.replace(' ', 'T')).toLocaleDateString('pt-BR');

//export const hora = (iso) =>
//  new Date(iso.replace(' ', 'T')).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

//export const unidades = (n) => `${n} ${n === 1 ? 'unidade' : 'unidades'}`;

//export const numero = (n) => Number(n).toLocaleString('pt-BR');



export const moeda = (valor) =>
  Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

// Interpreta os horários recebidos do MySQL como UTC.
function interpretarData(iso) {
  if (!iso) return null;

  const texto = String(iso).replace(' ', 'T');

  const possuiFuso = /Z$|[+-]\d{2}:\d{2}$/.test(texto);

  return new Date(possuiFuso ? texto : `${texto}Z`);
}

// Converte os horários para o fuso de Feira de Santana - BA.
const FUSO = 'America/Bahia';

export const dataHora = (iso) =>
  interpretarData(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: FUSO
  });

// Aceita "49,90", "49.90" e "1.299,90".
export function lerPreco(texto) {
  const t = String(texto).trim().replace(/^R\$\s*/, '');
  if (!t) return NaN;

  const normal = t.includes(',')
    ? t.replace(/\./g, '').replace(',', '.')
    : t;

  return Number(normal);
}

export const precoParaCampo = (numero) =>
  Number(numero).toFixed(2).replace('.', ',');

export const dataCurta = (iso) =>
  interpretarData(iso).toLocaleDateString('pt-BR', {
    timeZone: FUSO
  });

export const hora = (iso) =>
  interpretarData(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: FUSO
  });

export const unidades = (n) =>
  `${n} ${n === 1 ? 'unidade' : 'unidades'}`;

export const numero = (n) =>
  Number(n).toLocaleString('pt-BR');
