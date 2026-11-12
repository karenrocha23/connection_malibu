import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import db, { initializeDatabase, withTransaction } from './db.js';

const caminho = path.join(path.dirname(fileURLToPath(import.meta.url)), 'estoque.db');
let sqlite;

try {
  sqlite = new Database(caminho, { readonly: true, fileMustExist: true });
  sqlite.exec('BEGIN');
  const produtos = sqlite.prepare(`
    SELECT id, nome, categoria, codigo, cor, tamanho, modelo, preco, quantidade_estoque, estoque_minimo, criado_em
    FROM produtos ORDER BY id
  `).all();
  const movimentacoes = sqlite.prepare(`
    SELECT id, produto_id, tipo, quantidade, estoque_anterior, estoque_posterior, data
    FROM movimentacoes ORDER BY id
  `).all();
  sqlite.exec('COMMIT');

  await initializeDatabase();

  const [contagem] = await db.execute(`
    SELECT
      (SELECT COUNT(*) FROM produtos) AS produtos,
      (SELECT COUNT(*) FROM movimentacoes) AS movimentacoes
  `);
  if (Number(contagem[0].produtos) > 0 || Number(contagem[0].movimentacoes) > 0) {
    throw new Error('Migração cancelada: as tabelas MySQL já contêm dados. Faça backup e use um banco vazio.');
  }

  await withTransaction(async (connection) => {
    for (const produto of produtos) {
      await connection.execute(`
        INSERT INTO produtos
          (id, nome, categoria, codigo, cor, tamanho, modelo, preco, quantidade_estoque, estoque_minimo, criado_em)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        produto.id, produto.nome, produto.categoria, produto.codigo, produto.cor, produto.tamanho,
        produto.modelo, produto.preco, produto.quantidade_estoque, produto.estoque_minimo, produto.criado_em,
      ]);
    }

    for (const movimentacao of movimentacoes) {
      await connection.execute(`
        INSERT INTO movimentacoes
          (id, produto_id, tipo, quantidade, estoque_anterior, estoque_posterior, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        movimentacao.id, movimentacao.produto_id, movimentacao.tipo, movimentacao.quantidade,
        movimentacao.estoque_anterior, movimentacao.estoque_posterior, movimentacao.data,
      ]);
    }
  });

  console.log(`Migração concluída: ${produtos.length} produtos e ${movimentacoes.length} movimentações.`);
} finally {
  sqlite?.close();
  await db.end();
}
