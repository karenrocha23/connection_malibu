import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [status, setStatus] = useState('carregando');
  const [erroSessao, setErroSessao] = useState('');

  async function verificarSessao() {
    setStatus('carregando');
    setErroSessao('');
    try {
      const resposta = await api.obterSessao();
      setUsuario(resposta.usuario);
      setStatus('autenticado');
    } catch (erro) {
      if (erro.status === 401) {
        setUsuario(null);
        setStatus('nao-autenticado');
      } else {
        setErroSessao(erro.message);
        setStatus('erro');
      }
    }
  }

  async function entrar(nomeUsuario, senha) {
    const resposta = await api.entrar(nomeUsuario, senha);
    setUsuario(resposta.usuario);
    setStatus('autenticado');
  }

  async function configurarAdministrador(dados) {
    const resposta = await api.configurarAdministrador(dados);
    setUsuario(resposta.usuario);
    setStatus('autenticado');
  }

  async function sair() {
    await api.sair();
    setUsuario(null);
    setStatus('nao-autenticado');
  }

  useEffect(() => {
    void verificarSessao();
    const sessaoExpirada = () => {
      setUsuario(null);
      setStatus('nao-autenticado');
    };
    window.addEventListener('connection:auth-expired', sessaoExpirada);
    return () => window.removeEventListener('connection:auth-expired', sessaoExpirada);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, status, erroSessao, verificarSessao, entrar, configurarAdministrador, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return contexto;
}
