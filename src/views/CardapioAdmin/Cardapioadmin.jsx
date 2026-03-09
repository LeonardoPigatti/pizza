import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CardapioAdmin.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function precoMinimo(tamanhos) {
  if (!tamanhos?.length) return 0;
  return Math.min(...tamanhos.map((t) => t.preco));
}

export default function CardapioAdmin() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API}/produtos?pizzariaId=${pizzariaId}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error(data.erro || 'Erro ao buscar produtos');
        setProdutos(data);
      })
      .catch(err => setErro(err.message))
      .finally(() => setLoading(false));
  }, [pizzariaId]);

  return (
    <div className="ca-page">

      {/* Header */}
      <div className="ca-header">
        <button className="ca-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <div className="ca-header-info">
          <h1 className="ca-titulo">Cardápio</h1>
          <p className="ca-subtitulo">{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="ca-btn-novo" disabled title="Em breve">
          + Novo
        </button>
      </div>

      <div className="ca-layout">

        {loading && (
          <div className="ca-loading">
            <div className="ca-spinner" />
            <p>Carregando produtos...</p>
          </div>
        )}

        {erro && <div className="ca-erro">⚠️ {erro}</div>}

        {!loading && !erro && produtos.length === 0 && (
          <div className="ca-vazio">
            <span>🍕</span>
            <p>Nenhum produto cadastrado ainda.</p>
          </div>
        )}

        {!loading && !erro && (
          <div className="ca-lista">
            {produtos.map(produto => (
              <div key={produto._id} className="ca-card">
                <div className="ca-card-img">
                  {produto.imagem
                    ? <img src={produto.imagem} alt={produto.nome} />
                    : <span>🍕</span>
                  }
                </div>
                <div className="ca-card-info">
                  <div className="ca-card-nome">{produto.nome}</div>
                  <div className="ca-card-descricao">{produto.descricao}</div>
                  <div className="ca-card-tags">
                    {produto.categorias?.map(c => (
                      <span key={c} className="ca-tag">{c}</span>
                    ))}
                    {produto.tamanhos?.map(t => (
                      <span key={t.tamanho} className="ca-tag preco">{t.tamanho} · {formatarPreco(t.preco)}</span>
                    ))}
                  </div>
                </div>
                <div className="ca-card-acoes">
                  <button className="ca-btn-editar" disabled title="Em breve">
                    ✏️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}