import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './Cardapio.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getPizzaria(id) {
  const res = await fetch(`${API}/pizzarias/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao buscar pizzaria');
  return data;
}

function precoMinimo(tamanhos) {
  if (!tamanhos?.length) return null;
  return Math.min(...tamanhos.map((t) => t.preco));
}

function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function extrairCategorias(produtos) {
  const todas = produtos.flatMap((p) => p.categorias || []);
  return ['Todas', ...new Set(todas)];
}

function ProdutoCard({ produto, onAdicionar }) {
  return (
    <div className="produto-card">
      <div className="produto-img-wrapper">
        {produto.imagem ? (
          <img src={produto.imagem} alt={produto.nome} />
        ) : (
          <div className="produto-img-placeholder">🍕</div>
        )}
        {produto.categorias?.length > 0 && (
          <div className="produto-tags">
            {produto.categorias.map((cat) => (
              <span key={cat} className={`produto-tag ${cat.toLowerCase()}`}>{cat}</span>
            ))}
          </div>
        )}
      </div>
      <div className="produto-body">
        <h3 className="produto-nome">{produto.nome}</h3>
        {produto.descricao && <p className="produto-descricao">{produto.descricao}</p>}
        {produto.tamanhos?.length > 0 && (
          <div className="produto-precos">
            {produto.tamanhos.map((t) => (
              <div key={t.tamanho} className="preco-item">
                <span className="preco-tamanho">{t.tamanho}</span>
                <span className="preco-valor">{formatarPreco(t.preco)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="produto-footer">
          <div className="produto-a-partir">
            A partir de <strong>{formatarPreco(precoMinimo(produto.tamanhos) ?? 0)}</strong>
          </div>
          <button className="btn-adicionar" onClick={() => onAdicionar(produto)}>
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function GrupoCategoria({ categoria, produtos, onAdicionar }) {
  return (
    <div>
      <h2 className="categoria-titulo">{categoria}</h2>
      <div className="produtos-grid">
        {produtos.map((p) => (
          <ProdutoCard key={p._id} produto={p} onAdicionar={onAdicionar} />
        ))}
      </div>
    </div>
  );
}

export default function Cardapio() {
  const { pizzariaId } = useParams();
  const [pizzaria, setPizzaria]             = useState(null);
  const [produtos, setProdutos]             = useState([]);
  const [categorias, setCategorias]         = useState(['Todas']);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [loading, setLoading]               = useState(true);
  const [erro, setErro]                     = useState(null);

  useEffect(() => {
    getPizzaria(pizzariaId)
      .then((data) => {
        setPizzaria(data);
        setProdutos(data.cardapio || []);
        setCategorias(extrairCategorias(data.cardapio || []));
      })
      .catch((err) => setErro(err.message))
      .finally(() => setLoading(false));
  }, [pizzariaId]);

  function handleAdicionar(produto) {
    console.log('Adicionar ao pedido:', produto);
  }

  const produtosFiltrados =
    categoriaAtiva === 'Todas'
      ? produtos
      : produtos.filter((p) => p.categorias?.includes(categoriaAtiva));

  const grupos =
    categoriaAtiva === 'Todas'
      ? categorias
          .filter((c) => c !== 'Todas')
          .map((cat) => ({ categoria: cat, produtos: produtos.filter((p) => p.categorias?.includes(cat)) }))
          .filter((g) => g.produtos.length > 0)
      : [{ categoria: categoriaAtiva, produtos: produtosFiltrados }];

  return (
    <div>
      <header className="header">
        <div>
          <div className="header-logo">
            {pizzaria ? (
              <>{pizzaria.nome.split(' ')[0]}<span>{pizzaria.nome.split(' ').slice(1).join(' ')}</span></>
            ) : 'Cardápio'}
          </div>
          <div className="header-subtitle">Cardápio digital</div>
        </div>
      </header>

      <section className="hero">
        <span className="hero-tag">Feito com amor 🍕</span>
        <h1>Nossas <em>pizzas</em><br />favoritas</h1>
      </section>

      <nav className="categorias-nav">
        {categorias.map((cat) => (
          <button
            key={cat}
            className={`categoria-btn ${categoriaAtiva === cat ? 'ativa' : ''}`}
            onClick={() => setCategoriaAtiva(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <main className="cardapio-section">
        {loading && (
          <div className="estado-loading">
            <div className="spinner" />
            <p>Carregando cardápio...</p>
          </div>
        )}
        {erro && (
          <div className="estado-vazio">
            <div className="estado-vazio-icon">⚠️</div>
            <p>Erro: {erro}</p>
          </div>
        )}
        {!loading && !erro && grupos.length === 0 && (
          <div className="estado-vazio">
            <div className="estado-vazio-icon">🍕</div>
            <p>Nenhum produto encontrado.</p>
          </div>
        )}
        {!loading && !erro && grupos.map((g) => (
          <GrupoCategoria
            key={g.categoria}
            categoria={g.categoria}
            produtos={g.produtos}
            onAdicionar={handleAdicionar}
          />
        ))}
      </main>
    </div>
  );
}