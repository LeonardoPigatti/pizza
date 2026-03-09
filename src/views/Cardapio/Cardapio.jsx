import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Cardapio.css';
import ModalPizza from '../Modal/Modalpizza.jsx';
import Carrinho, { CarrinhoFAB } from '../Carrinho/Carrinho.jsx';
import { useCarrinho } from '../Carrinho/useCarrinho.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getPizzaria(id) {
  const res = await fetch(`${API}/pizzarias/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro ao buscar pizzaria');
  return data;
}

function formatarPreco(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function precoMinimo(tamanhos) {
  if (!tamanhos?.length) return 0;
  return Math.min(...tamanhos.map((t) => t.preco));
}

function extrairCategorias(produtos) {
  const todas = produtos.flatMap((p) => p.categorias || []);
  return [...new Set(todas)];
}

function ProdutoCard({ produto, onEscolher }) {
  return (
    <div className="produto-card">
      {produto.imagem ? (
        <img className="produto-img" src={produto.imagem} alt={produto.nome} />
      ) : (
        <div className="produto-img-placeholder">🍕</div>
      )}

      <div className="produto-body">
        <h3 className="produto-nome">{produto.nome}</h3>
        <p className="produto-descricao">{produto.descricao}</p>

        <div className="produto-footer">
          <div>
            <div className="produto-preco-label">A partir de</div>
            <div className="produto-preco">
              {formatarPreco(precoMinimo(produto.tamanhos))}
            </div>
          </div>

          <button
            className="btn-escolher"
            onClick={() => onEscolher(produto)}
          >
            Escolher
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Cardapio() {
  const { pizzariaId } = useParams();
  const navigate = useNavigate();

  const [pizzaria, setPizzaria]           = useState(null);
  const [produtos, setProdutos]           = useState([]);
  const [categorias, setCategorias]       = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todas');
  const [busca, setBusca]                 = useState('');
  const [loading, setLoading]             = useState(true);
  const [erro, setErro]                   = useState(null);
  const [modalProduto, setModalProduto]   = useState(null);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);

  const {
    itens,
    totalItens,
    subtotal,
    adicionarItem,
    alterarQuantidade,
    removerItem,
  } = useCarrinho();

useEffect(() => {
  async function carregar() {
    try {
      const pizzariaData = await getPizzaria(pizzariaId);
      setPizzaria(pizzariaData);
      document.title = pizzariaData.nome ? `${pizzariaData.nome} 🍕` : 'Cardápio';

      const res = await fetch(`${API}/produtos?pizzariaId=${pizzariaId}`);
      const produtosData = await res.json();
      if (!res.ok) throw new Error(produtosData.erro || 'Erro ao buscar produtos');
      setProdutos(produtosData);
      setCategorias(extrairCategorias(produtosData));
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }
  carregar();
}, [pizzariaId]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const porCategoria =
        categoriaAtiva === 'Todas' || p.categorias?.includes(categoriaAtiva);

      const porBusca =
        busca.trim() === '' ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(busca.toLowerCase());

      return porCategoria && porBusca;
    });
  }, [produtos, categoriaAtiva, busca]);

  function contarCategoria(cat) {
    if (cat === 'Todas') return produtos.length;
    return produtos.filter((p) => p.categorias?.includes(cat)).length;
  }

  function handleEscolher(produto) {
    setModalProduto(produto);
  }

  function handleAdicionarAoPedido(item) {
    adicionarItem(item);
    setCarrinhoAberto(true);
  }

  function handleFinalizarPedido() {
    setCarrinhoAberto(false);
    navigate(`/checkout/${pizzariaId}`, {
      state: { itens, subtotal },
    });
  }

  const abas = ['Todas', ...categorias];

  return (
    <div>

      {/* Banner */}
      <div className="banner">
        <img
          className="banner-img"
          src={
            pizzaria?.banner ||
            'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&q=80'
          }
          alt="Banner da pizzaria"
        />

        <div className="banner-overlay">
          <div className="banner-inner">
            <h1 className="banner-nome">
              {pizzaria?.nome || 'Pizzaria'}
            </h1>

            <p className="banner-slogan">
              Sabores autênticos da Itália
            </p>

            <div className="banner-infos">
              <span className="banner-info">⭐ 4.8</span>
              <span className="banner-info">🕐 30-40 min</span>
              <span className="banner-info">
                📍 {pizzaria?.endereco?.rua},{' '}
                {pizzaria?.endereco?.numero} -{' '}
                {pizzaria?.endereco?.bairro}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="busca-wrapper">
        <div className="busca-inner">
          <div className="busca-input-wrapper">
            <span className="busca-icon">🔍</span>
            <input
              className="busca-input"
              type="text"
              placeholder="Buscar pizza..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categorias */}
      <div className="categorias-bar-wrapper">
        <div className="categorias-bar">
          {abas.map((cat) => (
            <button
              key={cat}
              className={`categoria-tab ${
                categoriaAtiva === cat ? 'ativa' : ''
              }`}
              onClick={() => setCategoriaAtiva(cat)}
            >
              {cat} ({contarCategoria(cat)})
            </button>
          ))}
        </div>
      </div>

      {/* Produtos */}
      <div className="cardapio-container">
        <div className="produtos-grid">

          {loading && (
            <div className="estado-loading">
              <div className="spinner" />
              <p>Carregando cardápio...</p>
            </div>
          )}

          {erro && (
            <div className="estado-vazio">
              <p>⚠️ Erro: {erro}</p>
            </div>
          )}

          {!loading && !erro && produtosFiltrados.length === 0 && (
            <div className="estado-vazio">
              <p>🍕 Nenhuma pizza encontrada.</p>
            </div>
          )}

          {!loading && !erro &&
            produtosFiltrados.map((p) => (
              <ProdutoCard
                key={p._id}
                produto={p}
                onEscolher={handleEscolher}
              />
            ))}
        </div>
      </div>

      {/* Modal */}
      {modalProduto && (
        <ModalPizza
          produto={modalProduto}
          onFechar={() => setModalProduto(null)}
          onAdicionarAoPedido={handleAdicionarAoPedido}
        />
      )}

      {/* Botão flutuante do carrinho */}
      <CarrinhoFAB
        totalItens={totalItens}
        onClick={() => setCarrinhoAberto(true)}
      />

      {/* Drawer do carrinho */}
      {carrinhoAberto && (
        <Carrinho
          itens={itens}
          subtotal={subtotal}
          onFechar={() => setCarrinhoAberto(false)}
          onAlterarQtd={alterarQuantidade}
          onRemover={removerItem}
          onFinalizarPedido={handleFinalizarPedido}
        />
      )}

    </div>
  );
}