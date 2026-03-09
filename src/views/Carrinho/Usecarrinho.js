import { useState, useCallback } from 'react';

/**
 * Hook que gerencia o estado do carrinho de compras.
 * Cada item tem um `id` único gerado na hora da adição.
 */
export function useCarrinho() {
  const [itens, setItens] = useState([]);

  /** Adiciona um item novo (vindo do ModalPizza) */
  const adicionarItem = useCallback((item) => {
    setItens((prev) => [
      ...prev,
      { ...item, id: crypto.randomUUID() },
    ]);
  }, []);

  /** Altera a quantidade de um item pelo id */
  const alterarQuantidade = useCallback((id, delta) => {
    setItens((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantidade: item.quantidade + delta }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  }, []);

  /** Remove um item pelo id */
  const removerItem = useCallback((id) => {
    setItens((prev) => prev.filter((item) => item.id !== id));
  }, []);

  /** Limpa o carrinho */
  const limparCarrinho = useCallback(() => setItens([]), []);

  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);
  const subtotal   = itens.reduce((s, i) => s + i.totalItem, 0);

  return {
    itens,
    totalItens,
    subtotal,
    adicionarItem,
    alterarQuantidade,
    removerItem,
    limparCarrinho,
  };
}