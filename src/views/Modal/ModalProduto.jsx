import { useState, useEffect } from 'react';
import './Modalpizza.css';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

export default function ModalProduto({ produto, onFechar, onAdicionarAoPedido, itemEditando }) {
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    if (itemEditando) {
      setAdicionaisSelecionados(itemEditando.adicionais || []);
      setObservacao(itemEditando.observacao || '');
      setQuantidade(itemEditando.quantidade || 1);
    }
  }, [itemEditando]);

  function toggleAdicional(adicional) {
    setAdicionaisSelecionados(prev =>
      prev.find(a => a.nome === adicional.nome)
        ? prev.filter(a => a.nome !== adicional.nome)
        : [...prev, adicional]
    );
  }

  const precoAdicionais = adicionaisSelecionados.reduce((s, a) => s + a.preco, 0);
  const total = (produto.preco + precoAdicionais) * quantidade;

  function handleConfirmar() {
    onAdicionarAoPedido({
      produtoId:   produto._id,
      nomeProduto: produto.nome,
      tamanho:     null,
      preco:       produto.preco,
      sabores:     [],
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
            <div className="modal-titulo">{itemEditando ? 'Editar item' : produto.nome}</div>
            <div className="modal-subtitulo">{produto.categoria}</div>
          </div>
          <button className="modal-fechar" onClick={onFechar}>✕</button>
        </div>

        <div className="modal-body">

          {produto.imagem && (
            <img src={produto.imagem} alt={produto.nome}
              style={{ width: '100%', borderRadius: 12, marginBottom: 16, maxHeight: 180, objectFit: 'cover' }} />
          )}

          {produto.descricao && (
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: 16 }}>{produto.descricao}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e03c1f' }}>
              {formatarPreco(produto.preco)}
            </span>
          </div>

          {produto.adicionais?.length > 0 && (
            <div>
              <div className="modal-secao-titulo">Adicionais (Opcional)</div>
              <div className="adicionais-grid">
                {produto.adicionais.map(a => {
                  const selecionado = !!adicionaisSelecionados.find(x => x.nome === a.nome);
                  return (
                    <div key={a.nome}
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

          <div>
            <div className="modal-secao-titulo">Observações (Opcional)</div>
            <textarea className="obs-textarea"
              placeholder="Ex: Sem gelo, gelado..."
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          </div>

        </div>

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
