import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { normalizarUsuario, criarHashSenha } from '../services/auth.service.js';
import db, { initializeDatabase } from '../database/db.js';

function perguntarSenha(prompt) {
  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let senha = '';

    function finalizar(erro) {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener('keypress', aoPressionarTecla);
      stdout.write('\n');
      if (erro) reject(erro);
      else resolve(senha);
    }

    function aoPressionarTecla(texto, tecla) {
      if (tecla.ctrl && tecla.name === 'c') {
        finalizar(new Error('Operação cancelada.'));
      } else if (tecla.name === 'return' || tecla.name === 'enter') {
        finalizar();
      } else if (tecla.name === 'backspace') {
        senha = senha.slice(0, -1);
      } else if (texto && !tecla.ctrl && !tecla.meta) {
        senha += texto;
      }
    }

    stdin.on('keypress', aoPressionarTecla);
  });
}

if (!stdin.isTTY || !stdout.isTTY) {
  throw new Error('Execute este comando em um terminal interativo para informar a senha com segurança.');
}

const readline = createInterface({ input: stdin, output: stdout });
try {
  await initializeDatabase();
  const usuarioDigitado = await readline.question('Usuário (3 a 40 caracteres; letras, números, ponto, _ ou -): ');
  const usuario = normalizarUsuario(usuarioDigitado);
  if (!/^[a-z0-9._-]{3,40}$/.test(usuario)) {
    throw new Error('Nome de usuário inválido.');
  }

  const senha = await perguntarSenha('Senha (mínimo 12 caracteres): ');
  if (senha.length < 12 || senha.length > 128) {
    throw new Error('A senha deve ter entre 12 e 128 caracteres.');
  }
  const confirmacao = await perguntarSenha('Confirme a senha: ');
  if (senha !== confirmacao) throw new Error('As senhas não conferem.');

  const senhaHash = await criarHashSenha(senha);
  await db.execute('INSERT INTO usuarios (usuario, senha_hash, papel) VALUES (?, ?, ?)', [usuario, senhaHash, 'admin']);
  console.log(`Usuário "${usuario}" criado.`);
} catch (erro) {
  if (erro.code === 'ER_DUP_ENTRY') {
    console.error('Esse nome de usuário já está cadastrado.');
    process.exitCode = 1;
  } else {
    console.error(erro.message);
    process.exitCode = 1;
  }
} finally {
  readline.close();
  await db.end();
}
