import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import db from '../database/db.js';

const scrypt = promisify(scryptCallback);
const TAMANHO_HASH = 64;

export function normalizarUsuario(usuario) {
  return usuario.trim().toLowerCase();
}

export function validarCredenciais(usuario, senha) {
  const nome = typeof usuario === 'string' ? normalizarUsuario(usuario) : '';
  if (!/^[a-z0-9._-]{3,40}$/.test(nome)) {
    return { erro: 'O usuário deve ter de 3 a 40 caracteres: letras, números, ponto, _ ou -.' };
  }
  if (typeof senha !== 'string' || senha.length < 12 || senha.length > 128) {
    return { erro: 'A senha deve ter entre 12 e 128 caracteres.' };
  }
  return { usuario: nome, senha };
}

export async function criarHashSenha(senha) {
  const sal = randomBytes(16);
  const hash = await scrypt(senha, sal, TAMANHO_HASH, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${sal.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verificarSenha(senha, senhaHash) {
  const [algoritmo, salTexto, hashTexto] = senhaHash.split('$');
  if (algoritmo !== 'scrypt' || !salTexto || !hashTexto) return false;

  const sal = Buffer.from(salTexto, 'base64url');
  const hashArmazenado = Buffer.from(hashTexto, 'base64url');
  if (hashArmazenado.length !== TAMANHO_HASH) return false;

  const hashInformado = await scrypt(senha, sal, TAMANHO_HASH, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(hashInformado, hashArmazenado);
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function buscarUsuario(usuario) {
  const [usuarios] = await db.execute(
    'SELECT id, usuario, senha_hash, papel FROM usuarios WHERE usuario = ? LIMIT 1',
    [normalizarUsuario(usuario)]
  );
  return usuarios[0] ?? null;
}

export async function contarUsuarios() {
  const [[resultado]] = await db.execute('SELECT COUNT(*) AS total FROM usuarios');
  return Number(resultado.total);
}

export async function listarUsuarios() {
  const [usuarios] = await db.execute(
    'SELECT id, usuario, papel, criado_em FROM usuarios ORDER BY criado_em, id'
  );
  return usuarios;
}

export async function criarUsuario(usuario, senhaHash, papel = 'usuario') {
  const [resultado] = await db.execute(
    'INSERT INTO usuarios (usuario, senha_hash, papel) VALUES (?, ?, ?)',
    [usuario, senhaHash, papel]
  );
  return resultado.insertId;
}

export async function criarPrimeiroAdministrador(usuario, senhaHash) {
  const connection = await db.getConnection();
  let lockAdquirido = false;
  try {
    const [[lock]] = await connection.query("SELECT GET_LOCK('connection_initial_admin_setup', 0) AS adquirido");
    lockAdquirido = Number(lock.adquirido) === 1;
    if (!lockAdquirido) return null;

    const [[resultado]] = await connection.query('SELECT COUNT(*) AS total FROM usuarios');
    if (Number(resultado.total) > 0) return null;

    const [insercao] = await connection.execute(
      'INSERT INTO usuarios (usuario, senha_hash, papel) VALUES (?, ?, ?)',
      [usuario, senhaHash, 'admin']
    );
    return insercao.insertId;
  } finally {
    if (lockAdquirido) {
      await connection.query("SELECT RELEASE_LOCK('connection_initial_admin_setup')");
    }
    connection.release();
  }
}

export async function criarSessao(usuarioId, token) {
  const tokenHash = hashToken(token);
  await db.execute('DELETE FROM sessoes WHERE expira_em <= UTC_TIMESTAMP()');
  await db.execute(
    'INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 DAY))',
    [tokenHash, usuarioId]
  );
}

export async function buscarSessao(token) {
  const [sessoes] = await db.execute(`
    SELECT u.id, u.usuario, u.papel
    FROM sessoes s
    JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ? AND s.expira_em > UTC_TIMESTAMP()
    LIMIT 1
  `, [hashToken(token)]);
  return sessoes[0] ?? null;
}

export async function encerrarSessao(token) {
  await db.execute('DELETE FROM sessoes WHERE token_hash = ?', [hashToken(token)]);
}
