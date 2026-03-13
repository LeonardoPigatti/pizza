import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function RedefinirSenha() {
  const navigate          = useNavigate();
  const [searchParams]    = useSearchParams();
  const token             = searchParams.get('token');

  const [novaSenha, setNovaSenha]       = useState('');
  const [confirmar, setConfirmar]       = useState('');
  const [loading, setLoading]           = useState(false);
  const [concluido, setConcluido]       = useState(false);
  const [erro, setErro]                 = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    if (!token) setErro('Link inválido. Solicite um novo email de recuperação.');
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(null);

    if (novaSenha.length < 6)       return setErro('A senha deve ter pelo menos 6 caracteres.');
    if (novaSenha !== confirmar)     return setErro('As senhas não coincidem.');

    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/redefinir-senha`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao redefinir senha');
      setConcluido(true);
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
        <div className="login-titulo">Redefinir senha</div>

        {concluido ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <div className="login-subtitulo" style={{ color: '#16a34a', fontWeight: 700 }}>
              Senha redefinida!
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 8, lineHeight: 1.5 }}>
              Sua senha foi alterada com sucesso. Faça login com a nova senha.
            </p>
            <button className="login-btn" style={{ marginTop: 20 }} onClick={() => navigate('/login')}>
              Ir para o login
            </button>
          </div>
        ) : (
          <>
            <div className="login-subtitulo">
              Escolha uma nova senha para sua conta.
            </div>

            {erro && <div className="login-erro">{erro}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="login-campo">
                <label className="login-label">Nova senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="login-input"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    required
                    autoFocus
                    disabled={!token}
                    style={{ paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#aaa' }}
                  >
                    {mostrarSenha ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="login-campo">
                <label className="login-label">Confirmar nova senha</label>
                <input
                  className="login-input"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                  disabled={!token}
                />
              </div>

              {novaSenha && confirmar && novaSenha !== confirmar && (
                <div style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: -8 }}>
                  ⚠️ As senhas não coincidem
                </div>
              )}
              {novaSenha && novaSenha === confirmar && novaSenha.length >= 6 && (
                <div style={{ fontSize: '0.78rem', color: '#16a34a', marginTop: -8 }}>
                  ✓ Senhas coincidem
                </div>
              )}

              <button
                className="login-btn"
                type="submit"
                disabled={loading || !token || !novaSenha || !confirmar}
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}