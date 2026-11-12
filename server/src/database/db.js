import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const pasta = path.dirname(fileURLToPath(import.meta.url));

const obrigatorias = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE'];
const ausentes = obrigatorias.filter((nome) => !process.env[nome]);
if (ausentes.length > 0) {
  throw new Error(`Configure as variáveis de ambiente obrigatórias: ${ausentes.join(', ')}.`);
}

const db = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  dateStrings: true,
  decimalNumbers: true,
});

export async function initializeDatabase() {
  const schema = await readFile(path.join(pasta, 'schema.sql'), 'utf-8');
  const connection = await db.getConnection();
  try {
    for (const statement of schema.split(';').map((item) => item.trim()).filter(Boolean)) {
      await connection.query(statement);
    }

    const [[colunaPapel]] = await connection.query(`
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'usuarios' AND column_name = 'papel'
    `);
    if (Number(colunaPapel.total) === 0) {
      await connection.query(`
        ALTER TABLE usuarios
        ADD COLUMN papel VARCHAR(20) NOT NULL DEFAULT 'admin'
      `);
    }
  } finally {
    connection.release();
  }
}

export async function withTransaction(executar) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const resultado = await executar(connection);
    await connection.commit();
    return resultado;
  } catch (erro) {
    try {
      await connection.rollback();
    } catch (erroRollback) {
      throw new AggregateError([erro, erroRollback], 'A operação falhou e a transação não pôde ser revertida.');
    }
    throw erro;
  } finally {
    connection.release();
  }
}

export default db;
