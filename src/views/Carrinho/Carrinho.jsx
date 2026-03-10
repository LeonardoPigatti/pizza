import './Carrinho.css';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

export function CarrinhoFAB({ totalItens, onClick }) {
  if (totalItens === 0) return null;
  return (
    <button className="carrinho-fab" onClick={onClick} aria-label="Abrir carrinho">
      <span className="carrinho-fab-icone">🛒</span>
      <span>Ver carrinho</span>
      <span className="carrinho-fab-badge">{totalItens}</span>
    </button>
  );
}

function CarrinhoItem({ item, onAlterarQuantidade, onRemover, onEditar }) {
  const precoUnitario = item.totalItem / item.quantidade;

  const detalhes = [
    item.tamanho                  && item.tamanho,
    item.sabores?.length > 0      && `${item.sabores.join(', ')}`,
    item.adicionais?.length > 0   && `+ ${item.adicionais.map(a => a.nome).join(', ')}`,
    item.observacao               && `Obs: ${item.observacao}`,
  ].filter(Boolean).join(' · ');

  return (
    <div className="carrinho-item">
      <div className="carrinho-item-topo">
        <div className="carrinho-item-info">
          <div className="carrinho-item-nome">{item.nomeProduto}</div>
          <div className="carrinho-item-tamanho">{formatarPreco(precoUnitario)} cada</div>
          {detalhes && <div className="carrinho-item-detalhes">{detalhes}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div className="carrinho-item-preco">{formatarPreco(precoUnitario * item.quantidade)}</div>
          <button className="item-btn-editar" onClick={() => onEditar(item)} aria-label="Editar item">
            ✏️ Editar
          </button>
        </div>
      </div>

      <div className="carrinho-item-rodape">
        <div className="item-qtd-ctrl">
          <button className="item-qtd-btn" disabled={item.quantidade <= 1}
            onClick={() => onAlterarQuantidade(item.id, -1)}>−</button>
          <span className="item-qtd-valor">{item.quantidade}</span>
          <button className="item-qtd-btn"
            onClick={() => onAlterarQuantidade(item.id, 1)}>+</button>
        </div>
        <button className="item-btn-remover" onClick={() => onRemover(item.id)}>
          🗑 Remover
        </button>
      </div>
    </div>
  );
}

export default function Carrinho({ itens, subtotal, onFechar, onAlterarQtd, onRemover, onFinalizarPedido, onEditar }) {
  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onFechar();
  }

  return (
    <div className="carrinho-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="carrinho-drawer">

        <div className="carrinho-header">
          <div className="carrinho-header-esquerda">
            <span className="carrinho-titulo">Carrinho</span>
            {totalItens > 0 && (
              <span className="carrinho-qtd-badge">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</span>
            )}
          </div>
          <button className="carrinho-btn-fechar" onClick={onFechar}>✕</button>
        </div>

        {itens.length === 0 ? (
          <div className="carrinho-vazio">
            <div className="carrinho-vazio-icone">🛒</div>
            <p><strong>Seu carrinho está vazio</strong>Adicione itens para começar seu pedido!</p>
          </div>
        ) : (
          <div className="carrinho-lista">
            {itens.map(item => (
              <CarrinhoItem
                key={item.id}
                item={item}
                onAlterarQuantidade={onAlterarQtd}
                onRemover={onRemover}
                onEditar={onEditar}
              />
            ))}
          </div>
        )}

        {itens.length > 0 && (
          <div className="carrinho-rodape">
            <div className="carrinho-resumo">
              <div className="carrinho-resumo-linha">
                <span>Subtotal</span><span>{formatarPreco(subtotal)}</span>
              </div>
              <div className="carrinho-resumo-linha">
                <span>Taxa de entrega</span><span>A calcular</span>
              </div>
              <div className="carrinho-resumo-linha total">
                <span>Total estimado</span><span>{formatarPreco(subtotal)}</span>
              </div>
            </div>
            <button className="btn-finalizar" onClick={onFinalizarPedido}>
              🛍 Finalizar Pedido
            </button>
          </div>
        )}

      </div>
    </div>
  );
}