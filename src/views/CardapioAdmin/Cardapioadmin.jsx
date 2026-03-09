import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CardapioAdmin.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TAMANHOS_OPCOES = ['Pequena', 'Media', 'Grande'];
const TAMANHO_LABEL = { Pequena: 'Pequena', Media: 'Média', Grande: 'Grande' };

const PRODUTO_VAZIO = {
  nome: '', descricao: '', imagem: '', categorias: [],
  tamanhos: [], adicionais: [],
};

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

// ── Modal de edição / criação ──
function ModalProduto({ produto, pizzariaId, onSalvar, onFechar }) {
  const editando = !!produto._id;
  const [dados, setDados]       = useState({ ...PRODUTO_VAZIO, ...produto });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState(null);

  // Campos simples
  function handle(e) {
    const { name, value } = e.target;
    setDados(p => ({ ...p, [name]: value }));
  }

  // Categorias — string separada por vírgula
  function handleCategorias(e) {
    const cats = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
    setDados(p => ({ ...p, categorias: cats }));
  }

  // Tamanhos
  function setTamanho(tamanho, campo, valor) {
    setDados(p => {
      const lista = [...p.tamanhos];
      const idx   = lista.findIndex(t => t.tamanho === tamanho);
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], [campo]: campo === 'tamanho' ? valor : Number(valor) };
      } else {
        lista.push({ tamanho, preco: 0, maxSabores: 1, [campo]: Number(valor) });
      }
      return { ...p, tamanhos: lista };
    });
  }

  function toggleTamanho(tamanho) {
    setDados(p => {
      const existe = p.tamanhos.find(t => t.tamanho === tamanho);
      if (existe) return { ...p, tamanhos: p.tamanhos.filter(t => t.tamanho !== tamanho) };
      return { ...p, tamanhos: [...p.tamanhos, { tamanho, preco: 0, maxSabores: 1 }] };
    });
  }

  // Adicionais
  function addAdicional() {
    setDados(p => ({ ...p, adicionais: [...p.adicionais, { nome: '', preco: 0 }] }));
  }

  function setAdicional(i, campo, valor) {
    setDados(p => {
      const lista = [...p.adicionais];
      lista[i] = { ...lista[i], [campo]: campo === 'preco' ? Number(valor) : valor };
      return { ...p, adicionais: lista };
    });
  }

  function removeAdicional(i) {
    setDados(p => ({ ...p, adicionais: p.adicionais.filter((_, idx) => idx !== i) }));
  }

  async function salvar() {
    if (!dados.nome.trim()) { setErro('Nome é obrigatório'); return; }
    if (dados.tamanhos.length === 0) { setErro('Adicione pelo menos um tamanho'); return; }

    setSalvando(true);
    setErro(null);
    const token = localStorage.getItem('token');

    try {
      const url    = editando ? `${API}/produtos/${produto._id}` : `${API}/produtos`;
      const method = editando ? 'PATCH' : 'POST';
      const body   = editando ? dados : { ...dados, pizzariaId };

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao salvar');
      onSalvar(data, editando);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="ca-modal-overlay" onClick={onFechar}>
      <div className="ca-modal" onClick={e => e.stopPropagation()}>

        <div className="ca-modal-header">
          <span>{editando ? 'Editar produto' : 'Novo produto'}</span>
          <button onClick={onFechar}>✕</button>
        </div>

        <div className="ca-modal-body">

          {/* Básico */}
          <div className="ca-secao-titulo">Informações básicas</div>
          <div className="ca-campo">
            <label>Nome *</label>
            <input name="nome" value={dados.nome} onChange={handle} placeholder="Ex: Margherita" />
          </div>
          <div className="ca-campo">
            <label>Descrição</label>
            <textarea name="descricao" value={dados.descricao} onChange={handle} rows={2} placeholder="Ingredientes, destaques..." />
          </div>
          <div className="ca-campo">
            <label>URL da imagem</label>
            <input name="imagem" value={dados.imagem} onChange={handle} placeholder="https://..." />
            {dados.imagem && <img src={dados.imagem} alt="preview" className="ca-img-preview" />}
          </div>
          <div className="ca-campo">
            <label>Categorias (separadas por vírgula)</label>
            <input
              value={dados.categorias.join(', ')}
              onChange={handleCategorias}
              placeholder="Ex: Tradicional, Vegana"
            />
          </div>

          {/* Tamanhos */}
          <div className="ca-secao-titulo" style={{ marginTop: 20 }}>Tamanhos *</div>
          {TAMANHOS_OPCOES.map(tam => {
            const ativo = dados.tamanhos.find(t => t.tamanho === tam);
            return (
              <div key={tam} className={`ca-tamanho-row ${ativo ? 'ativo' : ''}`}>
                <label className="ca-tamanho-check">
                  <input
                    type="checkbox"
                    checked={!!ativo}
                    onChange={() => toggleTamanho(tam)}
                  />
                  <span>{tam}</span>
                </label>
                {ativo && (
                  <div className="ca-tamanho-campos">
                    <div className="ca-campo-inline">
                      <label>Preço (R$)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ativo.preco}
                        onChange={e => setTamanho(tam, 'preco', e.target.value)}
                      />
                    </div>
                    <div className="ca-campo-inline">
                      <label>Máx. sabores</label>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={ativo.maxSabores}
                        onChange={e => setTamanho(tam, 'maxSabores', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Adicionais */}
          <div className="ca-secao-titulo" style={{ marginTop: 20 }}>
            Adicionais
            <button className="ca-btn-add-adicional" onClick={addAdicional}>+ Adicionar</button>
          </div>
          {dados.adicionais.length === 0 && (
            <p className="ca-hint">Nenhum adicional. Clique em "+ Adicionar" para incluir.</p>
          )}
          {dados.adicionais.map((a, i) => (
            <div key={i} className="ca-adicional-row">
              <input
                className="ca-adicional-nome"
                placeholder="Nome do adicional"
                value={a.nome}
                onChange={e => setAdicional(i, 'nome', e.target.value)}
              />
              <input
                className="ca-adicional-preco"
                type="number"
                min="0"
                step="0.01"
                placeholder="R$"
                value={a.preco}
                onChange={e => setAdicional(i, 'preco', e.target.value)}
              />
              <button className="ca-btn-remove" onClick={() => removeAdicional(i)}>✕</button>
            </div>
          ))}

          {erro && <div className="ca-modal-erro">⚠️ {erro}</div>}
        </div>

        <div className="ca-modal-footer">
          <button className="ca-btn-cancelar" onClick={onFechar}>Cancelar</button>
          <button className="ca-btn-salvar-modal" onClick={salvar} disabled={salvando}>
            {salvando ? '⏳ Salvando...' : editando ? 'Salvar alterações' : 'Criar produto'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Página principal ──
export default function CardapioAdmin() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();

  const [produtos, setProdutos]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [erro, setErro]               = useState(null);
  const [modalProduto, setModalProduto] = useState(null); // null | {} (novo) | produto (editar)
  const [deletando, setDeletando]     = useState(null);
  const [busca, setBusca]             = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    buscarProdutos();
  }, [pizzariaId]);

  async function buscarProdutos() {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/produtos?pizzariaId=${pizzariaId}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error(data.erro || 'Erro ao buscar produtos');
      setProdutos(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Categorias únicas de todos os produtos
  const categorias = useMemo(() => {
    const todas = produtos.flatMap(p => p.categorias || []);
    return ['Todas', ...new Set(todas)];
  }, [produtos]);

  // Produtos filtrados
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const porBusca = busca.trim() === '' ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(busca.toLowerCase());
      const porCategoria = categoriaFiltro === 'Todas' || p.categorias?.includes(categoriaFiltro);
      return porBusca && porCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

  function handleSalvar(produto, editando) {
    if (editando) {
      setProdutos(prev => prev.map(p => p._id === produto._id ? produto : p));
    } else {
      setProdutos(prev => [produto, ...prev]);
    }
    setModalProduto(null);
  }

  async function handleDeletar(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    setDeletando(id);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API}/produtos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setProdutos(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setDeletando(null);
    }
  }

  return (
    <div className="ca-page">

      <div className="ca-header">
        <button className="ca-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <div className="ca-header-info">
          <h1 className="ca-titulo">Cardápio</h1>
          <p className="ca-subtitulo">{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="ca-btn-novo" onClick={() => setModalProduto(PRODUTO_VAZIO)}>
          + Novo
        </button>
      </div>

      <div className="ca-layout">

        {/* Filtros */}
        {!loading && !erro && produtos.length > 0 && (
          <div className="ca-filtros">
            <div className="ca-busca-wrapper">
              <span className="ca-busca-icon">🔍</span>
              <input
                className="ca-busca-input"
                placeholder="Buscar produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
              {busca && (
                <button className="ca-busca-limpar" onClick={() => setBusca('')}>✕</button>
              )}
            </div>
            <div className="ca-categorias">
              {categorias.map(cat => (
                <button
                  key={cat}
                  className={`ca-cat-btn ${categoriaFiltro === cat ? 'ativo' : ''}`}
                  onClick={() => setCategoriaFiltro(cat)}
                >
                  {cat}
                  {cat !== 'Todas' && (
                    <span className="ca-cat-count">
                      {produtos.filter(p => p.categorias?.includes(cat)).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {(busca || categoriaFiltro !== 'Todas') && (
              <div className="ca-resultado-info">
                {produtosFiltrados.length} de {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
                <button className="ca-limpar-filtros" onClick={() => { setBusca(''); setCategoriaFiltro('Todas'); }}>
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}


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
            <p>Nenhum produto ainda.</p>
            <button className="ca-btn-novo-vazio" onClick={() => setModalProduto(PRODUTO_VAZIO)}>
              + Criar primeiro produto
            </button>
          </div>
        )}

        {!loading && !erro && (
          <div className="ca-lista">
            {produtosFiltrados.length === 0 && !loading && (
              <div className="ca-vazio" style={{ padding: '30px 0' }}>
                <span>🔍</span>
                <p>Nenhum produto encontrado.</p>
              </div>
            )}
            {produtosFiltrados.map(produto => (
              <div key={produto._id} className="ca-card">
                <div className="ca-card-img">
                  {produto.imagem
                    ? <img src={produto.imagem} alt={produto.nome} />
                    : <span>🍕</span>
                  }
                </div>
                <div className="ca-card-info">
                  <div className="ca-card-nome">{produto.nome}</div>
                  <div className="ca-card-descricao">{produto.descricao || '—'}</div>
                  <div className="ca-card-tags">
                    {produto.categorias?.map(c => (
                      <span key={c} className="ca-tag">{c}</span>
                    ))}
                    {produto.tamanhos?.map(t => (
                      <span key={t.tamanho} className="ca-tag preco">
                        {t.tamanho} · {formatarPreco(t.preco)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ca-card-acoes">
                  <button className="ca-btn-editar" onClick={() => setModalProduto(produto)}>✏️</button>
                  <button
                    className="ca-btn-deletar"
                    onClick={() => handleDeletar(produto._id)}
                    disabled={deletando === produto._id}
                  >
                    {deletando === produto._id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {modalProduto !== null && (
        <ModalProduto
          produto={modalProduto}
          pizzariaId={pizzariaId}
          onSalvar={handleSalvar}
          onFechar={() => setModalProduto(null)}
        />
      )}

    </div>
  );
}