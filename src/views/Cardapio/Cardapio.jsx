import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Cardapio.css';
import ModalPizza from '../Modal/Modalpizza.jsx';
import ModalProduto from '../Modal/ModalProduto.jsx';
import Carrinho, { CarrinhoFAB } from '../Carrinho/Carrinho.jsx';
import { useCarrinho } from '../Carrinho/useCarrinho.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function precoMinimo(produto) {
  if (produto.tamanhos?.length > 0)
    return Math.min(...produto.tamanhos.map(t => t.preco));
  return produto.preco || 0;
}

function ProdutoCard({ produto, onEscolher }) {
  return (
    <div className="produto-card">
      {produto.imagem
        ? <img className="produto-img" src={produto.imagem} alt={produto.nome} />
        : <div className="produto-img-placeholder">🍽️</div>
      }
      <div className="produto-body">
        <h3 className="produto-nome">{produto.nome}</h3>
        <div className="produto-tags">
          {produto.categoria && <span className="produto-tag categoria">{produto.categoria}</span>}
          {produto.subcategorias?.map(s => (
            <span key={s} className="produto-tag">{s}</span>
          ))}
        </div>
        <p className="produto-descricao">{produto.descricao}</p>
        <div className="produto-footer">
          <div>
            <div className="produto-preco-label">
              {produto.tamanhos?.length > 0 ? 'A partir de' : 'Preço'}
            </div>
            <div className="produto-preco">{formatarPreco(precoMinimo(produto))}</div>
          </div>
          <button className="btn-escolher" onClick={() => onEscolher(produto)}>
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

  const [pizzaria, setPizzaria]               = useState(null);
  const [produtos, setProdutos]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [erro, setErro]                       = useState(null);
  const [categoriaAtiva, setCategoriaAtiva]   = useState('Todas');
  const [subcatAtiva, setSubcatAtiva]         = useState('Todas');
  const [busca, setBusca]                     = useState('');
  const [modalProduto, setModalProduto]       = useState(null);
  const [carrinhoAberto, setCarrinhoAberto]   = useState(false);

  const { itens, totalItens, subtotal, adicionarItem, alterarQuantidade, removerItem } = useCarrinho();

  useEffect(() => {
    async function carregar() {
      try {
        const [resPizzaria, resProdutos] = await Promise.all([
          fetch(`${API}/pizzarias/${pizzariaId}`),
          fetch(`${API}/produtos?pizzariaId=${pizzariaId}`),
        ]);
        const pizzariaData = await resPizzaria.json();
        if (!resPizzaria.ok) throw new Error(pizzariaData.erro || 'Pizzaria não encontrada');
        const produtosData = await resProdutos.json();
        if (!resProdutos.ok) throw new Error(produtosData.erro || 'Erro ao buscar produtos');
        setPizzaria(pizzariaData);
        document.title = pizzariaData.nome ? `${pizzariaData.nome} 🍕` : 'Cardápio';
        setProdutos(produtosData.filter(p => p.ativo !== false));
      } catch (err) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, [pizzariaId]);

  const categorias = useMemo(() => {
    const cats = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
    return ['Todas', ...cats];
  }, [produtos]);

  const subcategorias = useMemo(() => {
    if (categoriaAtiva === 'Todas') return [];
    const subs = produtos
      .filter(p => p.categoria === categoriaAtiva)
      .flatMap(p => p.subcategorias || []);
    return [...new Set(subs)];
  }, [produtos, categoriaAtiva]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const porCategoria = categoriaAtiva === 'Todas' || p.categoria === categoriaAtiva;
      const porSubcat    = subcatAtiva === 'Todas' || p.subcategorias?.includes(subcatAtiva);
      const porBusca     = busca.trim() === '' ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(busca.toLowerCase());
      return porCategoria && porSubcat && porBusca;
    });
  }, [produtos, categoriaAtiva, subcatAtiva, busca]);

  function handleCategoriaAtiva(cat) {
    setCategoriaAtiva(cat);
    setSubcatAtiva('Todas');
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
    navigate(`/checkout/${pizzariaId}`, { state: { itens, subtotal } });
  }

  const endereco = pizzaria?.endereco;
  const enderecoTexto = endereco?.rua
    ? `${endereco.rua}, ${endereco.numero} - ${endereco.bairro}` : null;

  return (
    <div>
      {/* Banner */}
      <div className="banner">
        <img className="banner-img"
          src={pizzaria?.banner || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&q=80'}
          alt="Banner" />
        <div className="banner-overlay">
          <div className="banner-inner">
            <h1 className="banner-nome">{pizzaria?.nome || 'Cardápio'}</h1>
            {pizzaria?.descricao && <p className="banner-slogan">{pizzaria.descricao}</p>}
            <div className="banner-infos">
              {pizzaria?.avaliacaoMedia > 0 && (
                <span className="banner-info">⭐ {pizzaria.avaliacaoMedia.toFixed(1)}</span>
              )}
              <span className="banner-info">🕐 {pizzaria?.tempoMedioEntrega || 40} min</span>
              {enderecoTexto && <span className="banner-info">📍 {enderecoTexto}</span>}
              {pizzaria?.horarios?.abertura && (
                <span className="banner-info">🕒 {pizzaria.horarios.abertura} – {pizzaria.horarios.fechamento}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="busca-wrapper">
        <div className="busca-inner">
          <div className="busca-input-wrapper">
            <span className="busca-icon">🔍</span>
            <input className="busca-input" type="text" placeholder="Buscar..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Abas de categoria */}
      <div className="categorias-bar-wrapper">
        <div className="categorias-bar">
          {categorias.map(cat => (
            <button
              key={cat}
              className={`categoria-tab ${categoriaAtiva === cat ? 'ativa' : ''}`}
              onClick={() => handleCategoriaAtiva(cat)}
            >
              {cat}
              <span className="cat-count">
                {cat === 'Todas'
                  ? produtos.length
                  : produtos.filter(p => p.categoria === cat).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subabas de subcategoria */}
      {subcategorias.length > 0 && (
        <div className="subcategorias-bar-wrapper">
          <div className="subcategorias-bar">
            <button
              className={`subcat-tab ${subcatAtiva === 'Todas' ? 'ativa' : ''}`}
              onClick={() => setSubcatAtiva('Todas')}
            >
              Todas
            </button>
            {subcategorias.map(sub => (
              <button
                key={sub}
                className={`subcat-tab ${subcatAtiva === sub ? 'ativa' : ''}`}
                onClick={() => setSubcatAtiva(sub)}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Produtos */}
      <div className="cardapio-container">
        <div className="produtos-grid">
          {loading && <div className="estado-loading"><div className="spinner" /><p>Carregando...</p></div>}
          {erro     && <div className="estado-vazio"><p>⚠️ {erro}</p></div>}
          {!loading && !erro && produtosFiltrados.length === 0 && (
            <div className="estado-vazio"><p>Nenhum produto encontrado.</p></div>
          )}
          {!loading && !erro && produtosFiltrados.map(p => (
            <ProdutoCard key={p._id} produto={p} onEscolher={handleEscolher} />
          ))}
        </div>
      </div>

      {modalProduto && modalProduto.temSabores && (
        <ModalPizza
          produto={modalProduto}
          onFechar={() => setModalProduto(null)}
          onAdicionarAoPedido={handleAdicionarAoPedido}
        />
      )}
      {modalProduto && !modalProduto.temSabores && (
        <ModalProduto
          produto={modalProduto}
          onFechar={() => setModalProduto(null)}
          onAdicionarAoPedido={handleAdicionarAoPedido}
        />
      )}

      <CarrinhoFAB totalItens={totalItens} onClick={() => setCarrinhoAberto(true)} />
      {carrinhoAberto && (
        <Carrinho
          itens={itens} subtotal={subtotal}
          onFechar={() => setCarrinhoAberto(false)}
          onAlterarQtd={alterarQuantidade}
          onRemover={removerItem}
          onFinalizarPedido={handleFinalizarPedido}
        />
      )}
    </div>
  );
}