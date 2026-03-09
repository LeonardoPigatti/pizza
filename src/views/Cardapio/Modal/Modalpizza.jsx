import { useState, useEffect } from 'react';
import './Modalpizza.css';

function formatarPreco(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

export default function ModalPizza({ produto, onFechar, onAdicionarAoPedido }) {
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [saboresSelecionados, setSaboresSelecionados] = useState([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [mostrarDropdownSabores, setMostrarDropdownSabores] = useState(false);

  // Seleciona o primeiro tamanho por padrão
  useEffect(() => {
    if (produto?.tamanhos?.length > 0) {
      setTamanhoSelecionado(produto.tamanhos[0]);
      setSaboresSelecionados([produto.nome]); // sabor padrão = a própria pizza
    }
  }, [produto]);

  if (!produto) return null;

  const maxSabores = tamanhoSelecionado?.maxSabores || 1;

  function toggleAdicional(adicional) {
    setAdicionaisSelecionados((prev) =>
      prev.find((a) => a.nome === adicional.nome)
        ? prev.filter((a) => a.nome !== adicional.nome)
        : [...prev, adicional]
    );
  }

  function adicionarSabor(sabor) {
    if (saboresSelecionados.length >= maxSabores) return;
    if (saboresSelecionados.includes(sabor)) return;
    setSaboresSelecionados((prev) => [...prev, sabor]);
    setMostrarDropdownSabores(false);
  }

  function removerSabor(sabor) {
    setSaboresSelecionados((prev) => prev.filter((s) => s !== sabor));
  }

  // Calcula total
  const precoBase = tamanhoSelecionado?.preco || 0;
  const precoAdicionais = adicionaisSelecionados.reduce((s, a) => s + a.preco, 0);
  const total = (precoBase + precoAdicionais) * quantidade;

  function handleConfirmar() {
    if (!tamanhoSelecionado) return;
    onAdicionarAoPedido({
      produtoId: produto._id,
      nomeProduto: produto.nome,
      tamanho: tamanhoSelecionado.tamanho,
      preco: tamanhoSelecionado.preco,
      sabores: saboresSelecionados,
      adicionais: adicionaisSelecionados,
      quantidade,
      observacao,
      totalItem: total,
    });
    onFechar();
  }

  // Fecha ao clicar fora
  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">

        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-titulo">Configure sua Pizza</div>
            <div className="modal-subtitulo">Escolha o tamanho, adicionais e quantidade</div>
          </div>
          <button className="modal-fechar" onClick={onFechar}>✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Tamanhos */}
          <div>
            <div className="modal-secao-titulo">Escolha o Tamanho</div>
            <div className="tamanhos-grid">
              {produto.tamanhos.map((t) => (
                <div
                  key={t.tamanho}
                  className={`tamanho-card ${tamanhoSelecionado?.tamanho === t.tamanho ? 'selecionado' : ''}`}
                  onClick={() => {
                    setTamanhoSelecionado(t);
                    // Reset sabores se maxSabores diminuiu
                    setSaboresSelecionados((prev) => prev.slice(0, t.maxSabores));
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
                onClick={() => setMostrarDropdownSabores((v) => !v)}
              >
                + Adicionar Sabor
              </button>
            </div>

            <div className="sabores-tags">
              {saboresSelecionados.length === 0 && (
                <span className="sabores-vazio">Nenhum sabor selecionado</span>
              )}
              {saboresSelecionados.map((s) => (
                <span key={s} className="sabor-tag">
                  {s}
                  <button onClick={() => removerSabor(s)}>✕</button>
                </span>
              ))}
            </div>

            {mostrarDropdownSabores && (
              <div className="sabores-dropdown">
                {produto.tamanhos.length > 0 && (
                  // Usa o nome da própria pizza + outros produtos do cardápio se passado
                  [produto.nome, ...(produto.outrosSabores || [])].map((sabor) => {
                    const jaAdicionado = saboresSelecionados.includes(sabor);
                    return (
                      <div
                        key={sabor}
                        className={`sabor-opcao ${jaAdicionado ? 'desabilitado' : ''}`}
                        onClick={() => !jaAdicionado && adicionarSabor(sabor)}
                      >
                        {sabor} {jaAdicionado ? '✓' : ''}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Adicionais */}
          {produto.adicionais?.length > 0 && (
            <div>
              <div className="modal-secao-titulo">Adicionais (Opcional)</div>
              <div className="adicionais-grid">
                {produto.adicionais.map((a) => {
                  const selecionado = !!adicionaisSelecionados.find((x) => x.nome === a.nome);
                  return (
                    <div
                      key={a.nome}
                      className={`adicional-item ${selecionado ? 'selecionado' : ''}`}
                      onClick={() => toggleAdicional(a)}
                    >
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
            <textarea
              className="obs-textarea"
              placeholder="Ex: Tirar cebola, massa fina, bem assada..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="quantidade-ctrl">
            <button
              className="qtd-btn"
              disabled={quantidade <= 1}
              onClick={() => setQuantidade((q) => q - 1)}
            >
              −
            </button>
            <span className="qtd-valor">{quantidade}</span>
            <button className="qtd-btn" onClick={() => setQuantidade((q) => q + 1)}>
              +
            </button>
          </div>

          <button className="btn-adicionar-pedido" onClick={handleConfirmar}>
            Adicionar · {formatarPreco(total)}
          </button>
        </div>

      </div>
    </div>
  );
}