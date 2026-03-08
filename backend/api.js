// src/services/api.js
// Centralize todas as chamadas ao backend aqui

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'Erro na requisição');
  return data;
}

// ---------- Produtos ----------
export const getProdutos = () => request('/produtos');
export const getProduto  = (id) => request(`/produtos/${id}`);
export const criarProduto = (body) => request('/produtos', { method: 'POST', body: JSON.stringify(body) });
export const atualizarProduto = (id, body) => request(`/produtos/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deletarProduto = (id) => request(`/produtos/${id}`, { method: 'DELETE' });

// ---------- Pedidos ----------
export const getPedidos = () => request('/pedidos');
export const getPedido  = (id) => request(`/pedidos/${id}`);
export const criarPedido = (body) => request('/pedidos', { method: 'POST', body: JSON.stringify(body) });
export const atualizarStatus = (id, statusPedido) =>
  request(`/pedidos/${id}/status`, { method: 'PATCH', body: JSON.stringify({ statusPedido }) });