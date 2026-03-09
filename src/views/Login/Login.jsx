import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [senha, setSenha]     = useState('');
  const [erro, setErro]       = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao fazer login');

      localStorage.setItem('token',   data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      navigate(`/dashboard/${data.usuario.pizzariaId}`);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <span className="login-logo-icone">🍕</span>
          <div className="login-logo-titulo">Área da Pizzaria</div>
          <div className="login-logo-sub">Acesse para gerenciar seus pedidos</div>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-form-group">
            <label className="login-label">Email</label>
            <input
              className="login-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-form-group">
            <label className="login-label">Senha</label>
            <input
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && <div className="login-erro">⚠️ {erro}</div>}

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? '⏳ Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
}