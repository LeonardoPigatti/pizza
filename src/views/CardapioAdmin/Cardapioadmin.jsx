import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CardapioAdmin.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TAMANHOS_PIZZA = ['Pequena', 'Media', 'Grande'];
const TAMANHO_LABEL  = { Pequena: 'Pequena', Media: 'Média', Grande: 'Grande' };

const CATEGORIAS_SUGERIDAS = ['Pizza', 'Hamburguer', 'Bebida', 'Doce', 'Entrada', 'Outro'];

const PRODUTO_VAZIO = {
  nome: '', descricao: '', imagem: '', categoria: 'Pizza',
  subcategorias: [], temSabores: true,
  tamanhos: [], preco: 0, adicionais: [], outrosSabores: [],
};

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

// ── Modal de confirmação de exclusão ──
function ModalConfirmarExclusao({ produto, onConfirmar, onCancelar }) {
  return (
    <div className="ca-modal-overlay" onClick={onCancelar}>
      <div className="ca-modal ca-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="ca-modal-header">
          <span>🗑️ Excluir produto</span>
          <button onClick={onCancelar}>✕</button>
        </div>
        <div className="ca-modal-body" style={{ textAlign: 'center', padding: '28px 24px 16px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚠️</div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: 6 }}>
            Excluir <span style={{ color: '#e03c1f' }}>{produto.nome}</span>?
          </p>
          <p style={{ fontSize: '0.82rem', color: '#999' }}>Essa ação não pode ser desfeita.</p>
        </div>
        <div className="ca-modal-footer">
          <button className="ca-btn-cancelar" onClick={onCancelar}>Cancelar</button>
          <button className="ca-btn-deletar-confirmar" onClick={onConfirmar}>Excluir</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de edição / criação ──
function ModalProduto({ produto, pizzariaId, onSalvar, onFechar }) {
  const editando = !!produto._id;
  const [dados, setDados]       = useState({ ...PRODUTO_VAZIO, ...produto });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState(null);
  const [subcatInput, setSubcatInput] = useState('');

  const ehPizza = dados.categoria === 'Pizza';

  function handle(e) {
    const { name, value } = e.target;
    setDados(p => ({ ...p, [name]: value }));
  }

  function handleCategoria(cat) {
    setDados(p => ({
      ...p,
      categoria:  cat,
      temSabores: cat === 'Pizza',
      tamanhos:   cat === 'Pizza' ? p.tamanhos : [],
    }));
  }

  function addSubcat() {
    const val = subcatInput.trim();
    if (!val || dados.subcategorias.includes(val)) return;
    setDados(p => ({ ...p, subcategorias: [...p.subcategorias, val] }));
    setSubcatInput('');
  }
  function removeSubcat(s) {
    setDados(p => ({ ...p, subcategorias: p.subcategorias.filter(x => x !== s) }));
  }

  function toggleTamanho(tam) {
    setDados(p => {
      const existe = p.tamanhos.find(t => t.tamanho === tam);
      if (existe) return { ...p, tamanhos: p.tamanhos.filter(t => t.tamanho !== tam) };
      return { ...p, tamanhos: [...p.tamanhos, { tamanho: tam, preco: 0, maxSabores: 1 }] };
    });
  }
  function setTamanho(tam, campo, valor) {
    setDados(p => {
      const lista = [...p.tamanhos];
      const idx   = lista.findIndex(t => t.tamanho === tam);
      if (idx >= 0) lista[idx] = { ...lista[idx], [campo]: Number(valor) };
      return { ...p, tamanhos: lista };
    });
  }

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

  const [saborInput, setSaborInput] = useState('');

  function addSabor() {
    const val = saborInput.trim();
    if (!val || dados.outrosSabores?.includes(val) || val === dados.nome) return;
    setDados(p => ({ ...p, outrosSabores: [...(p.outrosSabores || []), val] }));
    setSaborInput('');
  }
  function removeSabor(s) {
    setDados(p => ({ ...p, outrosSabores: p.outrosSabores.filter(x => x !== s) }));
  }

  async function salvar() {
    if (!dados.nome.trim()) { setErro('Nome é obrigatório'); return; }
    if (ehPizza && dados.tamanhos.length === 0) { setErro('Adicione pelo menos um tamanho'); return; }
    if (!ehPizza && !dados.preco) { setErro('Informe o preço'); return; }

    setSalvando(true);
    setErro(null);
    const token = localStorage.getItem('token');
    try {
      const url    = editando ? `${API}/produtos/${produto._id}` : `${API}/produtos`;
      const method = editando ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...dados, pizzariaId }),
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

          <div className="ca-secao-titulo">Categoria *</div>
          <div className="ca-categorias-grid">
            {CATEGORIAS_SUGERIDAS.map(cat => (
              <button
                key={cat}
                className={`ca-cat-opcao ${dados.categoria === cat ? 'ativo' : ''}`}
                onClick={() => handleCategoria(cat)}
                type="button"
              >
                {cat === 'Pizza' ? '🍕' : cat === 'Hamburguer' ? '🍔' : cat === 'Bebida' ? '🥤' : cat === 'Doce' ? '🍰' : cat === 'Entrada' ? '🥗' : '📦'} {cat}
              </button>
            ))}
          </div>
          {!CATEGORIAS_SUGERIDAS.includes(dados.categoria) && (
            <input className="ca-campo-input" name="categoria" value={dados.categoria}
              onChange={handle} placeholder="Categoria personalizada" style={{ marginTop: 8 }} />
          )}
          <button className="ca-link-btn" onClick={() => setDados(p => ({ ...p, categoria: '' }))} style={{ marginTop: 4 }}>
            + Categoria personalizada
          </button>

          <div className="ca-secao-titulo" style={{ marginTop: 20 }}>Subcategorias</div>
          <div className="ca-subcat-wrapper">
            <input className="ca-campo-input" placeholder="Ex: Vegana, Especial, Sem glúten..."
              value={subcatInput} onChange={e => setSubcatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubcat()} />
            <button className="ca-btn-add-subcat" onClick={addSubcat}>+</button>
          </div>
          {dados.subcategorias.length > 0 && (
            <div className="ca-tags-row">
              {dados.subcategorias.map(s => (
                <span key={s} className="ca-subcat-tag">
                  {s} <button onClick={() => removeSubcat(s)}>✕</button>
                </span>
              ))}
            </div>
          )}

          <div className="ca-secao-titulo" style={{ marginTop: 20 }}>Informações básicas</div>
          <div className="ca-campo">
            <label>Nome *</label>
            <input name="nome" value={dados.nome} onChange={handle}
              placeholder={`Ex: ${dados.categoria === 'Pizza' ? 'Margherita' : dados.categoria === 'Bebida' ? 'Coca-Cola' : dados.categoria === 'Hamburguer' ? 'Smash Burger' : 'Nome do produto'}`} />
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

          {!ehPizza && (
            <>
              <div className="ca-secao-titulo" style={{ marginTop: 20 }}>Preço *</div>
              <div className="ca-campo">
                <label>Preço (R$)</label>
                <input type="number" min="0" step="0.01" name="preco" value={dados.preco}
                  onChange={e => setDados(p => ({ ...p, preco: Number(e.target.value) }))} placeholder="0,00" />
              </div>
            </>
          )}

          {ehPizza && (
            <>
              <div className="ca-secao-titulo" style={{ marginTop: 20 }}>Tamanhos *</div>
              {TAMANHOS_PIZZA.map(tam => {
                const ativo = dados.tamanhos.find(t => t.tamanho === tam);
                return (
                  <div key={tam} className={`ca-tamanho-row ${ativo ? 'ativo' : ''}`}>
                    <label className="ca-tamanho-check">
                      <input type="checkbox" checked={!!ativo} onChange={() => toggleTamanho(tam)} />
                      <span>{TAMANHO_LABEL[tam]}</span>
                    </label>
                    {ativo && (
                      <div className="ca-tamanho-campos">
                        <div className="ca-campo-inline">
                          <label>Preço (R$)</label>
                          <input type="number" min="0" step="0.01" value={ativo.preco}
                            onChange={e => setTamanho(tam, 'preco', e.target.value)} />
                        </div>
                        <div className="ca-campo-inline">
                          <label>Máx. sabores</label>
                          <input type="number" min="1" max="4" value={ativo.maxSabores}
                            onChange={e => setTamanho(tam, 'maxSabores', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {ehPizza && (
            <>
              <div className="ca-secao-titulo" style={{ marginTop: 20 }}>
                Outros sabores disponíveis
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#aaa', marginLeft: 8 }}>
                  (além do sabor principal "{dados.nome || '...'}")
                </span>
              </div>
              <p className="ca-hint">O cliente poderá escolher entre estes sabores ao montar a pizza.</p>
              <div className="ca-subcat-wrapper">
                <input
                  className="ca-campo-input"
                  placeholder="Ex: Margherita, Calabresa, Frango..."
                  value={saborInput}
                  onChange={e => setSaborInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSabor()}
                />
                <button className="ca-btn-add-subcat" onClick={addSabor}>+</button>
              </div>
              {(dados.outrosSabores?.length > 0) && (
                <div className="ca-tags-row">
                  {dados.outrosSabores.map(s => (
                    <span key={s} className="ca-subcat-tag">
                      {s} <button onClick={() => removeSabor(s)}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="ca-secao-titulo" style={{ marginTop: 20 }}>
            Adicionais
            <button className="ca-btn-add-adicional" onClick={addAdicional}>+ Adicionar</button>
          </div>
          {dados.adicionais.length === 0 && <p className="ca-hint">Nenhum adicional ainda.</p>}
          {dados.adicionais.map((a, i) => (
            <div key={i} className="ca-adicional-row">
              <input className="ca-adicional-nome" placeholder="Ex: Extra, adicional ou complemento"
                value={a.nome} onChange={e => setAdicional(i, 'nome', e.target.value)} />
              <input className="ca-adicional-preco" type="number" min="0" step="0.01" placeholder="R$"
                value={a.preco} onChange={e => setAdicional(i, 'preco', e.target.value)} />
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

  const [produtos, setProdutos]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [erro, setErro]                       = useState(null);
  const [modalProduto, setModalProduto]       = useState(null);
  const [deletando, setDeletando]             = useState(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(null);
  const [busca, setBusca]                     = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [subcatFiltro, setSubcatFiltro]       = useState('Todas');

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
      if (!Array.isArray(data)) throw new Error(data.erro || 'Erro');
      setProdutos(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  const categorias = useMemo(() => {
    const cats = [...new Set(produtos.map(p => p.categoria).filter(Boolean))];
    return ['Todas', ...cats];
  }, [produtos]);

  const subcategorias = useMemo(() => {
    if (categoriaFiltro === 'Todas') return [];
    const subs = produtos.filter(p => p.categoria === categoriaFiltro).flatMap(p => p.subcategorias || []);
    return [...new Set(subs)];
  }, [produtos, categoriaFiltro]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const porCategoria = categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro;
      const porSubcat    = subcatFiltro === 'Todas' || p.subcategorias?.includes(subcatFiltro);
      const porBusca     = busca.trim() === '' ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(busca.toLowerCase());
      return porCategoria && porSubcat && porBusca;
    });
  }, [produtos, categoriaFiltro, subcatFiltro, busca]);

  function handleSalvar(produto, editando) {
    setProdutos(prev => editando ? prev.map(p => p._id === produto._id ? produto : p) : [produto, ...prev]);
    setModalProduto(null);
  }

  async function executarDeletar(produto) {
    setConfirmarExclusao(null);
    setDeletando(produto._id);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API}/produtos/${produto._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setProdutos(prev => prev.filter(p => p._id !== produto._id));
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setDeletando(null);
    }
  }

  function handleCategoriaFiltro(cat) {
    setCategoriaFiltro(cat);
    setSubcatFiltro('Todas');
  }

  return (
    <div className="ca-page">

      <div className="ca-header">
        <button className="ca-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <div className="ca-header-info">
          <h1 className="ca-titulo">Cardápio</h1>
          <p className="ca-subtitulo">{produtos.length} produto{produtos.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="ca-btn-novo" onClick={() => setModalProduto(PRODUTO_VAZIO)}>+ Novo</button>
      </div>

      <div className="ca-layout">

        {!loading && !erro && produtos.length > 0 && (
          <div className="ca-filtros">
            <div className="ca-busca-wrapper">
              <span className="ca-busca-icon">🔍</span>
              <input className="ca-busca-input" placeholder="Buscar produto..."
                value={busca} onChange={e => setBusca(e.target.value)} />
              {busca && <button className="ca-busca-limpar" onClick={() => setBusca('')}>✕</button>}
            </div>

            <div className="ca-abas">
              {categorias.map(cat => (
                <button key={cat} className={`ca-aba ${categoriaFiltro === cat ? 'ativo' : ''}`}
                  onClick={() => handleCategoriaFiltro(cat)}>
                  {cat}
                  {cat !== 'Todas' && (
                    <span className="ca-aba-count">{produtos.filter(p => p.categoria === cat).length}</span>
                  )}
                </button>
              ))}
            </div>

            {subcategorias.length > 0 && (
              <div className="ca-subabas">
                <button className={`ca-subaba ${subcatFiltro === 'Todas' ? 'ativo' : ''}`} onClick={() => setSubcatFiltro('Todas')}>Todas</button>
                {subcategorias.map(sub => (
                  <button key={sub} className={`ca-subaba ${subcatFiltro === sub ? 'ativo' : ''}`} onClick={() => setSubcatFiltro(sub)}>{sub}</button>
                ))}
              </div>
            )}

            {(busca || categoriaFiltro !== 'Todas' || subcatFiltro !== 'Todas') && (
              <div className="ca-resultado-info">
                {produtosFiltrados.length} de {produtos.length} produto{produtos.length !== 1 ? 's' : ''}
                <button className="ca-limpar-filtros" onClick={() => { setBusca(''); setCategoriaFiltro('Todas'); setSubcatFiltro('Todas'); }}>
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        )}

        {loading && <div className="ca-loading"><div className="ca-spinner" /><p>Carregando...</p></div>}
        {erro     && <div className="ca-erro">⚠️ {erro}</div>}

        {!loading && !erro && produtos.length === 0 && (
          <div className="ca-vazio">
            <button className="ca-btn-novo-vazio" onClick={() => setModalProduto(PRODUTO_VAZIO)}>
              + Criar primeiro produto
            </button>
          </div>
        )}

        {!loading && !erro && (
          <div className="ca-lista">
            {produtosFiltrados.length === 0 && (
              <div className="ca-vazio" style={{ padding: '30px 0' }}>
                <span>🔍</span><p>Nenhum produto encontrado.</p>
              </div>
            )}
            {produtosFiltrados.map(produto => (
              <div key={produto._id} className="ca-card">
                <div className="ca-card-img">
                  {produto.imagem ? <img src={produto.imagem} alt={produto.nome} /> : <span>🍽️</span>}
                </div>
                <div className="ca-card-info">
                  <div className="ca-card-nome">{produto.nome}</div>
                  <div className="ca-card-descricao">{produto.descricao || '—'}</div>
                  <div className="ca-card-tags">
                    <span className="ca-tag categoria">{produto.categoria}</span>
                    {produto.subcategorias?.map(s => <span key={s} className="ca-tag">{s}</span>)}
                    {produto.tamanhos?.length > 0
                      ? produto.tamanhos.map(t => <span key={t.tamanho} className="ca-tag preco">{t.tamanho} · {formatarPreco(t.preco)}</span>)
                      : produto.preco > 0 && <span className="ca-tag preco">{formatarPreco(produto.preco)}</span>
                    }
                  </div>
                </div>
                <div className="ca-card-acoes">
                  <button className="ca-btn-editar" onClick={() => setModalProduto(produto)}>✏️</button>
                  <button className="ca-btn-deletar" onClick={() => setConfirmarExclusao(produto)}
                    disabled={deletando === produto._id}>
                    {deletando === produto._id ? '⏳' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalProduto !== null && (
        <ModalProduto produto={modalProduto} pizzariaId={pizzariaId} onSalvar={handleSalvar} onFechar={() => setModalProduto(null)} />
      )}

      {confirmarExclusao && (
        <ModalConfirmarExclusao
          produto={confirmarExclusao}
          onConfirmar={() => executarDeletar(confirmarExclusao)}
          onCancelar={() => setConfirmarExclusao(null)}
        />
      )}
    </div>
  );
}