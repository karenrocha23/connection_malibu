import db, { withTransaction } from '../database/db.js';
import { validarProduto, ErroValidacao } from './produtos.validacao.js';

// Status calculado direto no SQL, para ficar sempre consistente:
//   sem_estoque   -> quantidade = 0
//   estoque_baixo -> 0 < quantidade <= estoque mínimo
//   normal        -> quantidade > estoque mínimo
const COLUNAS = `
  id, nome, categoria, codigo, cor, tamanho, modelo, preco,
  quantidade_estoque, estoque_minimo, criado_em,
  CASE
    WHEN quantidade_estoque = 0 THEN 'sem_estoque'
    WHEN quantidade_estoque <= estoque_minimo THEN 'estoque_baixo'
    ELSE 'normal'
  END AS status
`;

export async function listarProdutos({ busca, status } = {}) {
  let sql = `SELECT * FROM (SELECT ${COLUNAS} FROM produtos) AS produtos_filtrados WHERE 1 = 1`;
  const params = [];

  if (busca) {
    const termo = `%${busca}%`;
    sql += ` AND (nome LIKE ? OR codigo LIKE ? OR categoria LIKE ?
                  OR cor LIKE ? OR tamanho LIKE ? OR modelo LIKE ?)`;
    params.push(termo, termo, termo, termo, termo, termo);
  }
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY nome';
  const [produtos] = await db.execute(sql, params);
  return produtos;
}

// Produtos que precisam ser repostos: sem estoque ou com estoque <= mínimo.
// Ordem: primeiro os sem estoque; depois os de menor quantidade.
export async function listarProdutosParaRepor() {
  const [produtos] = await db.execute(`
    SELECT * FROM (SELECT ${COLUNAS} FROM produtos) AS produtos_filtrados
    WHERE status != 'normal'
    ORDER BY CASE status WHEN 'sem_estoque' THEN 0 ELSE 1 END,
             quantidade_estoque,
             nome
  `);
  return produtos;
}

export async function buscarProdutoPorId(id, executor = db) {
  const [produtos] = await executor.execute(`SELECT ${COLUNAS} FROM produtos WHERE id = ?`, [id]);
  return produtos[0];
}

export async function listarCategorias() {
  const [categorias] = await db.execute('SELECT DISTINCT categoria FROM produtos ORDER BY categoria');
  return categorias.map((linha) => linha.categoria);
}

export async function resumoEstoque() {
  const [linhas] = await db.execute(`
    SELECT
      COUNT(*)                                                                          AS total_produtos,
      COALESCE(SUM(quantidade_estoque), 0)                                              AS total_unidades,
      COALESCE(SUM(quantidade_estoque > 0 AND quantidade_estoque <= estoque_minimo), 0) AS estoque_baixo,
      COALESCE(SUM(quantidade_estoque = 0), 0)                                          AS sem_estoque
    FROM produtos
  `);
  return Object.fromEntries(
    Object.entries(linhas[0]).map(([campo, valor]) => [campo, Number(valor)])
  );
}

// Código é único, sem diferenciar maiúsculas de minúsculas
async function codigoEmUso(codigo, ignorarId = 0) {
  const [produtos] = await db.execute(
    'SELECT 1 FROM produtos WHERE lower(codigo) = lower(?) AND id != ?',
    [codigo, ignorarId]
  );
  return produtos.length > 0;
}

const CODIGO_DUPLICADO = { codigo: 'Já existe um produto com este código.' };

function tratarCodigoDuplicado(erro) {
  if (erro.code === 'ER_DUP_ENTRY') throw new ErroValidacao(CODIGO_DUPLICADO, 409);
  throw erro;
}

export async function criarProduto(dados) {
  const p = validarProduto(dados, { criacao: true });
  if (await codigoEmUso(p.codigo)) throw new ErroValidacao(CODIGO_DUPLICADO, 409);

  try {
    const id = await withTransaction(async (connection) => {
      const [resultado] = await connection.execute(`
        INSERT INTO produtos (nome, categoria, codigo, cor, tamanho, modelo, preco, quantidade_estoque, estoque_minimo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        p.nome, p.categoria, p.codigo, p.cor, p.tamanho, p.modelo, p.preco,
        p.estoque_inicial, p.estoque_minimo,
      ]);
      if (p.estoque_inicial > 0) {
        await connection.execute(`
          INSERT INTO movimentacoes (produto_id, tipo, quantidade, estoque_anterior, estoque_posterior)
          VALUES (?, 'entrada', ?, 0, ?)
        `, [resultado.insertId, p.estoque_inicial, p.estoque_inicial]);
      }
      return resultado.insertId;
    });
    return await buscarProdutoPorId(id);
  } catch (erro) {
    tratarCodigoDuplicado(erro);
  }
}

// A quantidade em estoque NÃO é editável aqui: ela só muda por entradas e saídas.
export async function atualizarProduto(id, dados) {
  if (!await buscarProdutoPorId(id)) return null;

  const p = validarProduto(dados, { criacao: false });
  if (await codigoEmUso(p.codigo, id)) throw new ErroValidacao(CODIGO_DUPLICADO, 409);

  try {
    await db.execute(`
      UPDATE produtos
      SET nome = ?, categoria = ?, codigo = ?, cor = ?, tamanho = ?, modelo = ?, preco = ?, estoque_minimo = ?
      WHERE id = ?
    `, [p.nome, p.categoria, p.codigo, p.cor, p.tamanho, p.modelo, p.preco, p.estoque_minimo, id]);
  } catch (erro) {
    tratarCodigoDuplicado(erro);
  }

  return await buscarProdutoPorId(id);
}
