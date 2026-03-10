import { useState, useCallback } from 'react';

export function useCarrinho() {
  const [itens, setItens] = useState([]);

  const adicionarItem = useCallback((item) => {
    setItens(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  }, []);

  const alterarQuantidade = useCallback((id, delta) => {
    setItens(prev =>
      prev
        .map(item => {
          if (item.id !== id) return item;
          const novaQtd   = item.quantidade + delta;
          const precoUnit = item.totalItem / item.quantidade;
          return { ...item, quantidade: novaQtd, totalItem: precoUnit * novaQtd };
        })
        .filter(item => item.quantidade > 0)
    );
  }, []);

  // Substitui um item existente mantendo o mesmo id
  const editarItem = useCallback((id, dadosNovos) => {
    setItens(prev => prev.map(item => item.id === id ? { ...dadosNovos, id } : item));
  }, []);

  const removerItem = useCallback((id) => {
    setItens(prev => prev.filter(item => item.id !== id));
  }, []);

  const limparCarrinho = useCallback(() => setItens([]), []);

  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);
  const subtotal   = itens.reduce((s, i) => s + i.totalItem, 0);

  return { itens, totalItens, subtotal, adicionarItem, alterarQuantidade, editarItem, removerItem, limparCarrinho };
}