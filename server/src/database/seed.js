import { withTransaction } from './db.js';

// Cada produto tem: dados + entrada e saída iniciais.
// Estoque final = entrada - saída (assim o histórico fica coerente).
const produtos = [
  { nome: 'Havaianas Top',     categoria: 'Chinelos', codigo: 'HAV-TOP-PT-3738', cor: 'Preto',  tamanho: '37/38', modelo: 'Top',         preco: 54.9,  minimo: 5, entrada: 30, saida: 5 },
  { nome: 'Havaianas Slim',    categoria: 'Chinelos', codigo: 'HAV-SLM-BR-3536', cor: 'Branco', tamanho: '35/36', modelo: 'Slim',        preco: 59.9,  minimo: 5, entrada: 10, saida: 6 },
  { nome: 'Bolsa Transversal', categoria: 'Bolsas',   codigo: 'BOL-TRV-PT',      cor: 'Preta',  tamanho: null,    modelo: 'Transversal', preco: 89.9,  minimo: 3, entrada: 15, saida: 3 },
  { nome: 'Bolsa Casual',      categoria: 'Bolsas',   codigo: 'BOL-CAS-MR',     cor: 'Marrom', tamanho: null,    modelo: 'Casual',      preco: 119.9, minimo: 3, entrada: 8,  saida: 6 },
  { nome: 'Boné Trucker',      categoria: 'Bonés',    codigo: 'BON-TRK-PT',      cor: 'Preto',  tamanho: null,    modelo: 'Trucker',     preco: 49.9,  minimo: 4, entrada: 10, saida: 10 },
  { nome: 'Boné Básico',       categoria: 'Bonés',    codigo: 'BON-BAS-AZ',      cor: 'Azul',   tamanho: null,    modelo: 'Básico',      preco: 39.9,  minimo: 5, entrada: 20, saida: 5 },
  { nome: 'Mochila Casual',    categoria: 'Mochilas', codigo: 'MOC-CAS-PT',      cor: 'Preta',  tamanho: null,    modelo: 'Casual',      preco: 149.9, minimo: 3, entrada: 8,  saida: 5 },
  { nome: 'Mochila Escolar',   categoria: 'Mochilas', codigo: 'MOC-ESC-AZ',      cor: 'Azul',   tamanho: null,    modelo: 'Escolar',     preco: 129.9, minimo: 4, entrada: 12, saida: 3 },
];

const formatarData = (data) => {
  const dois = (numero) => String(numero).padStart(2, '0');
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())} ${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`;
};

const dataAtras = (dias, horas) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  data.setHours(data.getHours() - horas);
  return formatarData(data);
};

await withTransaction(async (connection) => {
  await connection.execute('DELETE FROM movimentacoes');
  await connection.execute('DELETE FROM produtos');

  for (const [indice, produto] of produtos.entries()) {
    const estoqueFinal = produto.entrada - produto.saida;
    const [resultado] = await connection.execute(`
      INSERT INTO produtos (nome, categoria, codigo, cor, tamanho, modelo, preco, quantidade_estoque, estoque_minimo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      produto.nome, produto.categoria, produto.codigo, produto.cor, produto.tamanho, produto.modelo,
      produto.preco, estoqueFinal, produto.minimo,
    ]);

    await connection.execute(`
      INSERT INTO movimentacoes (produto_id, tipo, quantidade, estoque_anterior, estoque_posterior, data)
      VALUES (?, 'entrada', ?, 0, ?, ?), (?, 'saida', ?, ?, ?, ?)
    `, [
      resultado.insertId, produto.entrada, produto.entrada, dataAtras(20, indice),
      resultado.insertId, produto.saida, produto.entrada, estoqueFinal, dataAtras(5, indice),
    ]);
  }
});

console.log(`Banco populado: ${produtos.length} produtos e ${produtos.length * 2} movimentações.`);
