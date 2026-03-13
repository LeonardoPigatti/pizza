import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function EsqueciSenha() {
  const navigate      = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/esqueci-senha`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao enviar email');
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🍕</div>
        <div className="login-titulo">Esqueci minha senha</div>

        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📧</div>
            <div className="login-subtitulo" style={{ color: '#16a34a', fontWeight: 700 }}>
              Email enviado!
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 8, lineHeight: 1.5 }}>
              Se o email existir no sistema, você receberá um link para redefinir sua senha em breve. Verifique sua caixa de entrada e spam.
            </p>
            <button className="login-btn" style={{ marginTop: 20 }} onClick={() => navigate('/login')}>
              Voltar para o login
            </button>
          </div>
        ) : (
          <>
            <div className="login-subtitulo">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </div>

            {erro && <div className="login-erro">{erro}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="login-campo">
                <label className="login-label">Email</label>
                <input
                  className="login-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button className="login-btn" type="submit" disabled={loading || !email}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>

            <button
              className="login-link"
              onClick={() => navigate('/login')}
              style={{ marginTop: 12 }}
            >
              ← Voltar para o login
            </button>
          </>
        )}
      </div>
    </div>
  );
}