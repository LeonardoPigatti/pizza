import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'carrinho_itens';

export function useCarrinho() {
  const [itens, setItens] = useState(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      return salvo ? JSON.parse(salvo) : [];
    } catch { return []; }
  });

  // Persiste no localStorage sempre que itens mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
  }, [itens]);

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

  const editarItem = useCallback((id, dadosNovos) => {
    setItens(prev => prev.map(item => item.id === id ? { ...dadosNovos, id } : item));
  }, []);

  const removerItem = useCallback((id) => {
    setItens(prev => prev.filter(item => item.id !== id));
  }, []);

  const limparCarrinho = useCallback(() => {
    setItens([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalItens = itens.reduce((s, i) => s + i.quantidade, 0);
  const subtotal   = itens.reduce((s, i) => s + i.totalItem, 0);

  return { itens, totalItens, subtotal, adicionarItem, alterarQuantidade, editarItem, removerItem, limparCarrinho };
}