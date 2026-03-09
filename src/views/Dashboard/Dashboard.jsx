import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import Chat from '../Chat/Chat.jsx';
import { useChat } from '../Chat/useChat.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

function formatarHora(dataISO) {
  return new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarData(dataISO) {
  return new Date(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function calcularTotalItem(pizza) {
  const preco = pizza.produtoId?.tamanhos?.find(t => t.tamanho === pizza.tamanho)?.preco || 0;
  const adicionais = pizza.adicionais?.reduce((s, a) => s + a.preco * a.quantidade, 0) || 0;
  return (preco + adicionais) * pizza.quantidade;
}

function calcularTotalPedido(pedido) {
  return pedido.pizzas.reduce((s, p) => s + calcularTotalItem(p), 0);
}

const FILTROS = [
  { label: 'Todos',                valor: 'todos' },
  { label: 'Aguardando',           valor: 'Aguardando confirmacao' },
  { label: 'Preparando',           valor: 'Preparando' },
  { label: 'Saiu para entrega',    valor: 'Saiu para entrega' },
  { label: 'Concluido',            valor: 'Concluido' },
];

const PROXIMO_STATUS = {
  'Aguardando confirmacao': { label: 'Confirmar e Preparar', valor: 'Preparando' },
  'Preparando':             { label: 'Saiu para Entrega',    valor: 'Saiu para entrega' },
  'Saiu para entrega':      { label: 'Marcar como Concluido', valor: 'Concluido' },
  'Concluido':              null,
};

function statusClass(status) {
  if (status === 'Aguardando confirmacao') return 'aguardando';
  if (status === 'Preparando')             return 'preparando';
  if (status === 'Saiu para entrega')      return 'saiu';
  if (status === 'Concluido')              return 'concluido';
  return '';
}

export default function Dashboard() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();

  const [pedidos, setPedidos]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [erro, setErro]                     = useState(null);
  const [filtro, setFiltro]                 = useState('todos');
  const [usuario, setUsuario]               = useState(null);
  const [chatPedidoId, setChatPedidoId]     = useState(null);

  const chat = useChat(chatPedidoId, 'pizzaria');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('usuario');
    if (!token || !user) { navigate('/login'); return; }
    setUsuario(JSON.parse(user));
  }, []);

  useEffect(() => {
    async function buscar() {
      const token = localStorage.getItem('token');
      try {
        const res  = await fetch(`${API}/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.status === 401) { navigate('/login'); return; }
        if (!res.ok) throw new Error(data.erro);
        setPedidos(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    buscar();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    if (filtro === 'todos') return pedidos;
    return pedidos.filter(p => p.statusPedido === filtro);
  }, [pedidos, filtro]);

  const totalHoje = useMemo(() => {
    const hoje = new Date().toDateString();
    return pedidos.filter(p => new Date(p.createdAt).toDateString() === hoje);
  }, [pedidos]);

  const emAndamento   = pedidos.filter(p => p.statusPedido !== 'Concluido').length;
  const faturamentoHoje = totalHoje.reduce((s, p) => s + calcularTotalPedido(p), 0);

  async function atualizarStatus(pedidoId, novoStatus) {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/pedidos/${pedidoId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ statusPedido: novoStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setPedidos(prev => prev.map(p => p._id === pedidoId ? { ...p, statusPedido: novoStatus } : p));
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  }

  function toggleChat(pedidoId) {
    setChatPedidoId(prev => prev === pedidoId ? null : pedidoId);
  }

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  return (
    <div className="dashboard-page">

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-esquerda">
          <span className="dashboard-logo">🍕</span>
          <div>
            <div className="dashboard-titulo">Painel de Pedidos</div>
            <div className="dashboard-subtitulo">{usuario?.nome}</div>
          </div>
        </div>
        <button className="btn-sair" onClick={sair}>Sair</button>
      </div>

      <div className="dashboard-layout">

        {/* Resumo */}
        <div className="dashboard-resumo">
          <div className="resumo-card">
            <span className="resumo-card-icone">📋</span>
            <div>
              <div className="resumo-card-label">Pedidos hoje</div>
              <div className="resumo-card-valor">{totalHoje.length}</div>
            </div>
          </div>
          <div className="resumo-card">
            <span className="resumo-card-icone">🔥</span>
            <div>
              <div className="resumo-card-label">Em andamento</div>
              <div className={`resumo-card-valor ${emAndamento > 0 ? 'vermelho' : ''}`}>{emAndamento}</div>
            </div>
          </div>
          <div className="resumo-card">
            <span className="resumo-card-icone">💰</span>
            <div>
              <div className="resumo-card-label">Faturamento hoje</div>
              <div className="resumo-card-valor verde">{formatarPreco(faturamentoHoje)}</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="dashboard-filtros">
          {FILTROS.map(f => (
            <button
              key={f.valor}
              className={`filtro-btn ${filtro === f.valor ? 'ativo' : ''}`}
              onClick={() => setFiltro(f.valor)}
            >
              {f.label}
              {f.valor !== 'todos' && (
                <span style={{ marginLeft: 6, opacity: 0.7 }}>
                  ({pedidos.filter(p => p.statusPedido === f.valor).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Estados */}
        {loading && (
          <div className="dashboard-loading">
            <div className="dashboard-spinner" />
            <p>Carregando pedidos...</p>
          </div>
        )}
        {erro && <div className="dashboard-vazio">⚠️ {erro}</div>}
        {!loading && !erro && pedidosFiltrados.length === 0 && (
          <div className="dashboard-vazio">Nenhum pedido encontrado.</div>
        )}

        {/* Lista de pedidos */}
        <div className="pedidos-lista">
          {!loading && !erro && pedidosFiltrados.map(pedido => (
            <div key={pedido._id} className="pedido-card">

              {/* Header do card */}
              <div className="pedido-card-header">
                <div className="pedido-card-header-esquerda">
                  <div>
                    <div className="pedido-numero">#{pedido._id.toString().slice(-5).toUpperCase()}</div>
                    <div className="pedido-hora">{formatarData(pedido.createdAt)} às {formatarHora(pedido.createdAt)}</div>
                  </div>
                  <span className="pedido-badge-entrega">
                    {pedido.tipoEntrega === 'Entrega' ? '🛵 Entrega' : '🏪 Retirada'}
                  </span>
                </div>
                <span className={`pedido-status-badge ${statusClass(pedido.statusPedido)}`}>
                  {pedido.statusPedido}
                </span>
              </div>

              {/* Body do card */}
              <div className="pedido-card-body">
                <div className="pedido-itens">
                  {pedido.pizzas.map((pizza, i) => (
                    <div key={i} className="pedido-item-linha">
                      <strong>{pizza.quantidade}× {pizza.produtoId?.nome || 'Pizza'}</strong>
                      {' '}· {pizza.tamanho}
                      <div className="pedido-item-detalhe">
                        {pizza.sabores?.join(', ')}
                        {pizza.adicionais?.length > 0 && ` + ${pizza.adicionais.map(a => a.nome).join(', ')}`}
                        {pizza.observacao && ` — ${pizza.observacao}`}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pedido-card-direita">
                  <div className="pedido-contato">
                    <strong>{pedido.contato?.nome}</strong>
                    {pedido.contato?.telefone}
                    {pedido.enderecoEntrega?.bairro && (
                      <span style={{ display: 'block' }}>📍 {pedido.enderecoEntrega.bairro}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#e03c1f' }}>
                    {formatarPreco(calcularTotalPedido(pedido))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                    💳 {pedido.pagamento}
                  </div>

                  {/* Botões de ação */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    {PROXIMO_STATUS[pedido.statusPedido] && (
                      <button
                        className="btn-proximo-status"
                        onClick={() => atualizarStatus(pedido._id, PROXIMO_STATUS[pedido.statusPedido].valor)}
                      >
                        {PROXIMO_STATUS[pedido.statusPedido].label}
                      </button>
                    )}
                    <button
                      className="btn-chat"
                      onClick={() => toggleChat(pedido._id)}
                    >
                      {chatPedidoId === pedido._id ? '✕ Fechar chat' : '💬 Chat com cliente'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Chat inline */}
              {chatPedidoId === pedido._id && (
                <div style={{ borderTop: '1px solid #f0f0f0' }}>
                  <Chat
                    mensagens={chat.mensagens}
                    texto={chat.texto}
                    setTexto={chat.setTexto}
                    enviar={chat.enviar}
                    handleKeyDown={chat.handleKeyDown}
                    autorLocal="pizzaria"
                    carregando={chat.carregando}
                  />
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}