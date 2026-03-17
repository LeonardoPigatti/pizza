import { useState, useEffect } from 'react';
import './Modalpizza.css';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

export default function ModalPizza({ produto, onFechar, onAdicionarAoPedido, itemEditando, pizzariaId }) {
  const [tamanhoSelecionado, setTamanhoSelecionado]     = useState(null);
  const [saboresSelecionados, setSaboresSelecionados]   = useState([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);
  const [observacao, setObservacao]                     = useState('');
  const [quantidade, setQuantidade]                     = useState(1);
  const [mostrarDropdownSabores, setMostrarDropdownSabores] = useState(false);
  const [pizzasDisponiveis, setPizzasDisponiveis]           = useState([]);

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const pid = pizzariaId || produto?.pizzariaId;
    if (!pid) return;
    fetch(`${API}/produtos?pizzariaId=${pid}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data))
          setPizzasDisponiveis(data.filter(p => p.categoria === 'Pizza' && p.ativo));
      })
      .catch(() => {});
  }, [pizzariaId]);

  useEffect(() => {
    if (itemEditando) {
      // Pré-preenche com os dados do item existente
      const tam = produto.tamanhos.find(t => t.tamanho === itemEditando.tamanho);
      setTamanhoSelecionado(tam || produto.tamanhos[0]);
      setSaboresSelecionados(itemEditando.sabores || []);
      setAdicionaisSelecionados(itemEditando.adicionais || []);
      setObservacao(itemEditando.observacao || '');
      setQuantidade(itemEditando.quantidade || 1);
    } else if (produto?.tamanhos?.length > 0) {
      setTamanhoSelecionado(produto.tamanhos[0]);
      setSaboresSelecionados([produto.nome]);
    }
  }, [produto, itemEditando]);

  if (!produto) return null;

  const maxSabores = tamanhoSelecionado?.maxSabores || 1;

  function toggleAdicional(adicional) {
    setAdicionaisSelecionados(prev =>
      prev.find(a => a.nome === adicional.nome)
        ? prev.filter(a => a.nome !== adicional.nome)
        : [...prev, adicional]
    );
  }

  function adicionarSabor(sabor) {
    if (saboresSelecionados.length >= maxSabores) return;
    if (saboresSelecionados.includes(sabor)) return;
    setSaboresSelecionados(prev => [...prev, sabor]);
    setMostrarDropdownSabores(false);
  }

  function removerSabor(sabor) {
    setSaboresSelecionados(prev => prev.filter(s => s !== sabor));
  }

  // Preço mais alto entre os sabores selecionados (regra da casa)
  const precoPorSabor = (nomeSabor) => {
    const p = pizzasDisponiveis.find(p => p.nome === nomeSabor);
    return p?.tamanhos?.find(t => t.tamanho === tamanhoSelecionado?.tamanho)?.preco ?? 0;
  };
  const precoBase = saboresSelecionados.length > 1
    ? Math.max(...saboresSelecionados.map(precoPorSabor))
    : (tamanhoSelecionado?.preco || 0);
  const precoAdicionais = adicionaisSelecionados.reduce((s, a) => s + a.preco, 0);
  const total           = (precoBase + precoAdicionais) * quantidade;

  // Nome da pizza: "½ Palmito + ½ Brócolis" ou nome simples
  const nomePizza = saboresSelecionados.length > 1
    ? saboresSelecionados.map(s => `½ ${s}`).join(' + ')
    : produto.nome;

  function handleConfirmar() {
    if (!tamanhoSelecionado) return;
    onAdicionarAoPedido({
      produtoId:   produto._id,
      nomeProduto: nomePizza,
      tamanho:     tamanhoSelecionado.tamanho,
      preco:       precoBase,
      sabores:     saboresSelecionados,
      adicionais:  adicionaisSelecionados,
      quantidade,
      observacao,
      totalItem:   total,
    });
    onFechar();
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal">

        <div className="modal-header">
          <div>
            <div className="modal-titulo">{itemEditando ? 'Editar item' : 'Configure sua Pizza'}</div>
            <div className="modal-subtitulo">Escolha o tamanho, adicionais e quantidade</div>
          </div>
          <button className="modal-fechar" onClick={onFechar}>✕</button>
        </div>

        <div className="modal-body">

          {/* Tamanhos */}
          <div>
            <div className="modal-secao-titulo">Escolha o Tamanho</div>
            <div className="tamanhos-grid">
              {produto.tamanhos.map(t => (
                <div
                  key={t.tamanho}
                  className={`tamanho-card ${tamanhoSelecionado?.tamanho === t.tamanho ? 'selecionado' : ''}`}
                  onClick={() => {
                    setTamanhoSelecionado(t);
                    setSaboresSelecionados(prev => prev.slice(0, t.maxSabores));
                  }}
                >
                  <div className="tamanho-nome">{t.tamanho}</div>
                  <div className="tamanho-info">{t.maxSabores} sabor{t.maxSabores > 1 ? 'es' : ''}</div>
                  <div className="tamanho-preco">{formatarPreco(t.preco)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sabores */}
          <div>
            <div className="sabores-header">
              <div className="modal-secao-titulo" style={{ marginBottom: 0 }}>
                Sabores ({saboresSelecionados.length}/{maxSabores})
              </div>
              <button
                className="btn-add-sabor"
                disabled={saboresSelecionados.length >= maxSabores}
                onClick={() => setMostrarDropdownSabores(v => !v)}
              >
                + Adicionar Sabor
              </button>
            </div>
            <div className="sabores-tags">
              {saboresSelecionados.length === 0 && <span className="sabores-vazio">Nenhum sabor selecionado</span>}
              {saboresSelecionados.map(s => (
                <span key={s} className="sabor-tag">
                  {s}<button onClick={() => removerSabor(s)}>✕</button>
                </span>
              ))}
            </div>
            {mostrarDropdownSabores && (
              <div className="sabores-dropdown">
                {pizzasDisponiveis.map(p => {
                  const jaAdicionado = saboresSelecionados.includes(p.nome);
                  return (
                    <div
                      key={p._id}
                      className={`sabor-opcao ${jaAdicionado ? 'desabilitado' : ''}`}
                      onClick={() => !jaAdicionado && adicionarSabor(p.nome)}
                    >
                      {p.nome} {jaAdicionado ? '✓' : ''}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Adicionais */}
          {produto.adicionais?.length > 0 && (
            <div>
              <div className="modal-secao-titulo">Adicionais (Opcional)</div>
              <div className="adicionais-grid">
                {produto.adicionais.map(a => {
                  const selecionado = !!adicionaisSelecionados.find(x => x.nome === a.nome);
                  return (
                    <div key={a.nome} className={`adicional-item ${selecionado ? 'selecionado' : ''}`}
                      onClick={() => toggleAdicional(a)}>
                      <div className="adicional-check">{selecionado ? '✓' : ''}</div>
                      <span className="adicional-nome">{a.nome}</span>
                      <span className="adicional-preco">+ {formatarPreco(a.preco)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observação */}
          <div>
            <div className="modal-secao-titulo">Observações (Opcional)</div>
            <textarea className="obs-textarea"
              placeholder="Ex: Tirar cebola, massa fina..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          </div>

        </div>

        {saboresSelecionados.length > 1 && (() => {
          const precos = saboresSelecionados.map(s => ({ nome: s, preco: precoPorSabor(s) }));
          const maior  = precos.reduce((a, b) => a.preco >= b.preco ? a : b);
          const todos  = precos.every(p => p.preco === maior.preco);
          if (todos) return null;
          return (
            <div className="modal-aviso-preco">
              💡 O valor cobrado é o do sabor mais caro: <strong>{maior.nome}</strong> ({formatarPreco(maior.preco)})
            </div>
          );
        })()}

        <div className="modal-footer">
          <div className="quantidade-ctrl">
            <button className="qtd-btn" disabled={quantidade <= 1} onClick={() => setQuantidade(q => q - 1)}>−</button>
            <span className="qtd-valor">{quantidade}</span>
            <button className="qtd-btn" onClick={() => setQuantidade(q => q + 1)}>+</button>
          </div>
          <button className="btn-adicionar-pedido" onClick={handleConfirmar}>
            {itemEditando ? 'Salvar alterações' : 'Adicionar'} · {formatarPreco(total)}
          </button>
        </div>

      </div>
    </div>
  );
}
