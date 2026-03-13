import { useState, useEffect, useMemo, useRef } from 'react';
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
  let preco = 0;
  if (pizza.preco && pizza.preco > 0) {
    preco = pizza.preco;
  } else if (pizza.tamanho && pizza.produtoId?.tamanhos?.length > 0) {
    const tam = pizza.produtoId.tamanhos.find(t => t.tamanho === pizza.tamanho);
    preco = tam?.preco || 0;
  } else if (pizza.produtoId?.preco) {
    preco = pizza.produtoId.preco;
  }
  const adicionais = pizza.adicionais?.reduce((s, a) => s + (a.preco || 0) * (a.quantidade || 1), 0) || 0;
  return (preco + adicionais) * (pizza.quantidade || 1);
}
function calcularTotalPedido(pedido, taxaEntregaLoja) {
  const subtotal = pedido.pizzas.reduce((s, p) => s + calcularTotalItem(p), 0);
  // suporta tanto cupons[] (novo) quanto cupom{} (legado)
  const cupons   = pedido.cupons?.length > 0 ? pedido.cupons : (pedido.cupom ? [pedido.cupom] : []);
  const freteGratis = cupons.some(c => c.tipo === 'frete_gratis');
  const taxa     = pedido.tipoEntrega === 'Retirada' || freteGratis
    ? 0
    : Number(pedido.taxaEntrega ?? taxaEntregaLoja ?? 0);
  const desconto = cupons.reduce((s, c) => s + Number(c.desconto || 0), 0);
  return Math.max(0, subtotal + taxa - desconto);
}

const STATUS_ORDEM = ['Aguardando confirmacao', 'Preparando', 'Saiu para entrega', 'Concluido'];

const TODOS_STATUS = [
  { valor: 'Aguardando confirmacao', label: 'Aguardando confirmacao' },
  { valor: 'Preparando',             label: 'Preparando' },
  { valor: 'Saiu para entrega',      label: 'Saiu para entrega' },
  { valor: 'Concluido',              label: 'Concluido' },
];

const FILTROS_ADMIN = [
  { label: 'Todos',               valor: 'todos' },
  { label: 'Aguardando',          valor: 'Aguardando confirmacao' },
  { label: 'Preparando',          valor: 'Preparando' },
  { label: 'Saiu para entrega',   valor: 'Saiu para entrega' },
  { label: '🏪 Ret. cliente',     valor: 'pronto-retirada' },
  { label: 'Concluido',           valor: 'Concluido' },
];

const FILTROS_MOTOBOY = [
  { label: '⏳ Aguardando retirada', valor: 'aguardando-retirada' },
  { label: '🛵 Em entrega',          valor: 'em-entrega' },
  { label: '✅ Concluido',           valor: 'Concluido' },
];

const PROXIMO_STATUS = {
  'Aguardando confirmacao': { label: 'Confirmar e Preparar',  valor: 'Preparando' },
  'Preparando':             { label: 'Saiu para Entrega',     valor: 'Saiu para entrega' },
  'Saiu para entrega':      { label: 'Marcar como Concluido', valor: 'Concluido' },
  'Concluido':              null,
};

// Retorna label/ícone do status levando em conta se é retirada
function labelStatus(status, tipoEntrega) {
  const ehRetirada = tipoEntrega === 'Retirada';
  if (status === 'Saiu para entrega') return ehRetirada ? '🔔 Pronto para retirada' : '🛵 Saiu para entrega';
  if (status === 'Aguardando confirmacao') return '⏳ Aguardando confirmação';
  if (status === 'Preparando')             return '👨‍🍳 Preparando';
  if (status === 'Concluido')              return ehRetirada ? '✅ Retirado' : '✅ Entregue';
  return status;
}

// Label do botão de próximo status
function labelProximoStatus(status, tipoEntrega) {
  const ehRetirada = tipoEntrega === 'Retirada';
  if (status === 'Preparando') return ehRetirada ? 'Pronto para retirada' : 'Saiu para Entrega';
  if (status === 'Saiu para entrega') return 'Marcar como Concluído';
  if (status === 'Aguardando confirmacao') return 'Confirmar e Preparar';
  return '';
}

function statusClass(status) {
  if (status === 'Aguardando confirmacao') return 'aguardando';
  if (status === 'Preparando')             return 'preparando';
  if (status === 'Saiu para entrega')      return 'saiu';
  if (status === 'Concluido')              return 'concluido';
  if (status === 'Cancelado')              return 'cancelado';
  return '';
}

// Badge visual do status no card do pedido
function badgeStatus(pedido) {
  const { statusPedido, tipoEntrega } = pedido;
  return labelStatus(statusPedido, tipoEntrega);
}

function ModalCodigo({ pedido, onConfirmar, onCancelar }) {
  const [codigo, setCodigo]   = useState('');
  const [erro, setErro]       = useState('');

  function verificar() {
    if (codigo.trim().toUpperCase() === pedido.codigoSeguranca) {
      onConfirmar();
    } else {
      setErro('Código incorreto. Verifique com o cliente.');
      setCodigo('');
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-retrocesso" onClick={e => e.stopPropagation()}>
        <div className="modal-retrocesso-header">
          <span>🔐 Confirmar entrega</span>
          <button onClick={onCancelar}>✕</button>
        </div>
        <div className="modal-retrocesso-body" style={{ textAlign: 'center', padding: '24px 24px 16px' }}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔐</div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: 4 }}>
            Pedido #{pedido._id.slice(-5).toUpperCase()}
          </p>
          <p style={{ fontSize: '0.82rem', color: '#999', marginBottom: 16 }}>
            Peça o código de segurança ao cliente e digite abaixo para confirmar a entrega.
          </p>
          <input
            style={{
              width: '100%', textAlign: 'center', fontSize: '1.6rem', fontWeight: 900,
              letterSpacing: '0.3em', padding: '12px', border: `2px solid ${erro ? '#ef4444' : '#ddd'}`,
              borderRadius: 10, outline: 'none', textTransform: 'uppercase', fontFamily: 'monospace',
            }}
            maxLength={6}
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setErro(''); }}
            onKeyDown={e => e.key === 'Enter' && verificar()}
            placeholder="_ _ _ _ _ _"
            autoFocus
          />
          {erro && (
            <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
              ⚠️ {erro}
            </div>
          )}
        </div>
        <div className="modal-retrocesso-footer">
          <button className="btn-cancelar-retrocesso" onClick={onCancelar}>Cancelar</button>
          <button className="btn-confirmar-retrocesso" onClick={verificar} disabled={codigo.length < 4}>
            Confirmar entrega
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCancelar({ pedido, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState('');

  const pagamentosOnline = ['online', 'cartao online', 'pix', 'crédito', 'débito'];
  const ehOnline = pagamentosOnline.some(p => pedido.pagamento?.toLowerCase().includes(p));

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-retrocesso" onClick={e => e.stopPropagation()}>
        <div className="modal-retrocesso-header">
          <span>🚫 Cancelar pedido #{pedido._id.slice(-5).toUpperCase()}</span>
          <button onClick={onCancelar}>✕</button>
        </div>
        <div className="modal-retrocesso-body">
          {ehOnline ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔒</div>
              <p style={{ fontWeight: 700, color: '#222' }}>Não é possível cancelar</p>
              <p style={{ fontSize: '0.82rem', color: '#999', marginTop: 4 }}>
                Este pedido foi pago online e não pode ser cancelado pelo sistema.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 12 }}>
                Informe o motivo do cancelamento. O cliente verá essa mensagem.
              </p>
              <textarea
                style={{
                  width: '100%', minHeight: 80, border: '1.5px solid #e0e0e0',
                  borderRadius: 10, padding: '10px 12px', fontSize: '0.88rem',
                  fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box',
                }}
                placeholder="Ex: Produto em falta, encerramos o horário..."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
              />
            </>
          )}
        </div>
        <div className="modal-retrocesso-footer">
          <button className="btn-cancelar-retrocesso" onClick={onCancelar}>Voltar</button>
          {!ehOnline && (
            <button
              className="btn-confirmar-retrocesso"
              style={{ background: '#ef4444' }}
              onClick={() => motivo.trim() && onConfirmar(motivo)}
              disabled={!motivo.trim()}
            >
              Confirmar cancelamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalRetrocesso({ pedido, novoStatus, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-retrocesso" onClick={e => e.stopPropagation()}>
        <div className="modal-retrocesso-header">
          <span>⚠️ Retornar status do pedido</span>
          <button onClick={onCancelar}>✕</button>
        </div>
        <div className="modal-retrocesso-body">
          <p>
            Você está retornando o pedido
            <strong> #{pedido._id.toString().slice(-5).toUpperCase()} </strong>
            de <strong>{pedido.statusPedido}</strong> para <strong>{novoStatus}</strong>.
          </p>
          <label className="modal-retrocesso-label">Motivo *</label>
          <textarea
            className="modal-retrocesso-textarea"
            placeholder="Ex: Cliente solicitou alteração, erro no preparo..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-retrocesso-footer">
          <button className="btn-cancelar-retrocesso" onClick={onCancelar}>Cancelar</button>
          <button
            className="btn-confirmar-retrocesso"
            onClick={() => onConfirmar(motivo)}
            disabled={!motivo.trim()}
          >
            Confirmar retorno
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();

  const [taxaEntrega, setTaxaEntrega]         = useState(0);
  const [pedidos, setPedidos]                 = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [erro, setErro]                       = useState(null);
  const [filtro, setFiltro]                   = useState('todos');
  const [usuario, setUsuario]                 = useState(null);
  const [chatPedidoId, setChatPedidoId]       = useState(null);
  const [modalRetrocesso, setModalRetrocesso] = useState(null);
  const [modalCodigo, setModalCodigo]         = useState(null); // { pedidoId }
  const [modalCancelar, setModalCancelar]     = useState(null); // { pedido }
  const [menuAberto, setMenuAberto]           = useState(false);
  const [statusLoja, setStatusLoja]           = useState('open');
  const [modalFecharLoja, setModalFecharLoja] = useState(false);
  const [modalLojaAviso, setModalLojaAviso]   = useState(false);
  const [naoLidas, setNaoLidas]               = useState({});

  const mensagensIniciais = useRef({});
  const perfil     = usuario?.perfil || 'admin';
  const autorLabel = perfil === 'motoboy' ? '🛵 Motoboy' : '🍕 Pizzaria';
  const chat       = useChat(chatPedidoId, 'pizzaria', autorLabel, perfil);

  useEffect(() => {
    if (!chatPedidoId || !chat.mensagens.length) return;
    const ultima = chat.mensagens[chat.mensagens.length - 1];
    if (ultima.autor === 'pizzaria' || chatPedidoId === ultima.pedidoId) return;
    setNaoLidas(prev => ({ ...prev, [chatPedidoId]: true }));
  }, [chat.mensagens]);

  useEffect(() => {
    if (!window.__socketPizzaria) return;
    const handler = (msg) => {
      if (msg.autor === 'pizzaria' || chatPedidoId === msg.pedidoId) return;
      setNaoLidas(prev => ({ ...prev, [msg.pedidoId]: true }));
    };
    window.__socketPizzaria.on('mensagem', handler);
    return () => window.__socketPizzaria.off('mensagem', handler);
  }, [chatPedidoId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('usuario');
    if (!token || !user) { navigate('/login'); return; }
    const u = JSON.parse(user);
    setUsuario(u);
    if (u.perfil === 'motoboy') setFiltro('aguardando-retirada');
  }, []);

  useEffect(() => {
    async function buscar() {
      const token = localStorage.getItem('token');
      try {
        const [resPedidos, resPizzaria] = await Promise.all([
          fetch(`${API}/pedidos`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/pizzarias/${pizzariaId}`),
        ]);
        const data = await resPedidos.json();
        if (resPedidos.status === 401) { navigate('/login'); return; }
        if (!resPedidos.ok) throw new Error(data.erro);
        setPedidos(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        const pizzariaData = await resPizzaria.json();
        if (resPizzaria.ok) {
          setStatusLoja(pizzariaData.status || 'open');
          setTaxaEntrega(pizzariaData.taxaEntrega || 0);
        }
      } catch (err) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    buscar();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    // Motoboy só vê pedidos de entrega
    const base = perfil === 'motoboy'
      ? pedidos.filter(p => p.tipoEntrega === 'Entrega')
      : pedidos;
    if (filtro === 'todos') return base;
    if (filtro === 'aguardando-retirada') return base.filter(p => p.statusPedido === 'Saiu para entrega' && !p.motoboyPegou);
    if (filtro === 'em-entrega')          return base.filter(p => p.statusPedido === 'Saiu para entrega' && p.motoboyPegou);
    if (filtro === 'pronto-retirada')     return base.filter(p => p.statusPedido === 'Saiu para entrega' && p.tipoEntrega === 'Retirada');
    if (filtro === 'Saiu para entrega')   return base.filter(p => p.statusPedido === 'Saiu para entrega' && p.tipoEntrega === 'Entrega');
    return base.filter(p => p.statusPedido === filtro);
  }, [pedidos, filtro]);

  const totalHoje = useMemo(() => {
    const hoje = new Date().toDateString();
    return pedidos.filter(p => new Date(p.createdAt).toDateString() === hoje);
  }, [pedidos]);

  const emAndamento     = pedidos.filter(p => p.statusPedido !== 'Concluido').length;
  const faturamentoHoje = totalHoje.reduce((s, p) => s + calcularTotalPedido(p, taxaEntrega), 0);

  async function atualizarStatus(pedidoId, novoStatus, motivo = null) {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/pedidos/${pedidoId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ statusPedido: novoStatus, motivo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setPedidos(prev => prev.map(p => p._id === pedidoId ? data : p));
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  }

  async function cancelarPedido(pedido, motivo) {
    try {
      const token = localStorage.getItem('token');
      const res  = await fetch(`${API}/pedidos/${pedido._id}/cancelar`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ motivo, canceladoPor: 'pizzaria' }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.erro); return; }
      setPedidos(prev => prev.map(p => p._id === pedido._id ? data : p));
    } catch (err) {
      alert('Erro ao cancelar pedido: ' + err.message);
    }
  }

  function handleMudarStatus(pedido, novoStatus) {
    const idxAtual = STATUS_ORDEM.indexOf(pedido.statusPedido);
    const idxNovo  = STATUS_ORDEM.indexOf(novoStatus);
    if (idxNovo < idxAtual) setModalRetrocesso({ pedido, novoStatus });
    else if (novoStatus === 'Concluido' && pedido.codigoSeguranca) setModalCodigo({ pedido });
    else atualizarStatus(pedido._id, novoStatus);
  }

  function confirmarRetrocesso(motivo) {
    atualizarStatus(modalRetrocesso.pedido._id, modalRetrocesso.novoStatus, motivo);
    setModalRetrocesso(null);
  }

  function abrirMapa(endereco) {
    const { rua, numero, bairro, cidade, cep } = endereco;
    const query = encodeURIComponent(`${rua}, ${numero} - ${bairro}, ${cidade || ''} ${cep || ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  }

  async function pegarPizza(pedidoId) {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/pedidos/${pedidoId}/pegar`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setPedidos(prev => prev.map(p => p._id === pedidoId ? data : p));
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  function toggleChat(pedidoId) {
    if (chatPedidoId === pedidoId) { setChatPedidoId(null); return; }
    setChatPedidoId(pedidoId);
    setNaoLidas(prev => ({ ...prev, [pedidoId]: false }));
  }

  function sair() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  }

  async function confirmarFecharLoja() {
    const novoStatus = statusLoja === 'open' ? 'closed' : 'open';
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/pizzarias/${pizzariaId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status da loja');
      setStatusLoja(novoStatus);

      if (novoStatus === 'closed') {
        const hoje        = new Date().toDateString();
        const pedidosHoje = pedidos.filter(p => new Date(p.createdAt).toDateString() === hoje && p.statusPedido === 'Concluido');
        const faturamentoTotal = pedidosHoje.reduce((s, p) => s + p.pizzas.reduce((ps, pz) => ps + calcularTotalItem(pz), 0), 0);
        const somarPedido = p => p.pizzas.reduce((s, pz) => s + calcularTotalItem(pz), 0);
        const comAvaliacao = pedidosHoje.filter(p => p.avaliacao != null);

        const contagemProdutos = {};
        pedidosHoje.forEach(p => p.pizzas.forEach(pizza => {
          const nome = pizza.nomeProduto || pizza.produtoId?.nome || 'Produto';
          if (!contagemProdutos[nome]) contagemProdutos[nome] = { nome, quantidade: 0, faturamento: 0 };
          contagemProdutos[nome].quantidade  += pizza.quantidade;
          contagemProdutos[nome].faturamento += calcularTotalItem(pizza);
        }));

        await fetch(`${API}/financeiro`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            pizzariaId,
            data:               new Date(),
            horaFechamento:     new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            totalPedidos:       pedidosHoje.length,
            pedidosEntrega:     pedidosHoje.filter(p => p.tipoEntrega === 'Entrega').length,
            pedidosRetirada:    pedidosHoje.filter(p => p.tipoEntrega === 'Retirada').length,
            faturamentoTotal,
            ticketMedio:        pedidosHoje.length > 0 ? faturamentoTotal / pedidosHoje.length : 0,
            totalCartaoOnline:  pedidosHoje.filter(p => p.pagamento === 'Cartao online').reduce((s, p) => s + somarPedido(p), 0),
            totalDinheiro:      pedidosHoje.filter(p => p.pagamento === 'Dinheiro na entrega').reduce((s, p) => s + somarPedido(p), 0),
            qtdCartaoOnline:    pedidosHoje.filter(p => p.pagamento === 'Cartao online').length,
            qtdDinheiro:        pedidosHoje.filter(p => p.pagamento === 'Dinheiro na entrega').length,
            topProdutos:        Object.values(contagemProdutos).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5),
            avaliacaoMediaDia:  comAvaliacao.length > 0 ? Math.round(comAvaliacao.reduce((s, p) => s + p.avaliacao, 0) / comAvaliacao.length * 10) / 10 : null,
            totalAvaliacoesDia: comAvaliacao.length,
          }),
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setModalFecharLoja(false);
    }
  }

  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div className="dashboard-header-esquerda">
          <span className="dashboard-logo">🍕</span>
          <div>
            <div className="dashboard-titulo">Painel de Pedidos</div>
            <div className="dashboard-subtitulo">{usuario?.nome}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {perfil === 'admin' && (
            <div className="menu-admin-wrapper">
              <button className="btn-perfil-pizzaria" onClick={() => setMenuAberto(p => !p)} title="Menu da pizzaria">
                🍕
              </button>
              {menuAberto && (
                <>
                  <div className="menu-admin-overlay" onClick={() => setMenuAberto(false)} />
                  <div className="menu-admin-dropdown">
                    <button className="menu-admin-item" onClick={() => { setMenuAberto(false); navigate(`/perfil/${pizzariaId}`); }}>
                      ✏️ Editar perfil
                    </button>
                    <button className="menu-admin-item" onClick={() => { setMenuAberto(false); navigate(`/cardapio-admin/${pizzariaId}`); }}>
                      🍕 Editar cardápio
                    </button>
                    <div className="menu-admin-divider" />
                    <button
                      className={`menu-admin-item ${statusLoja === 'open' ? 'fechar-loja' : 'abrir-loja'}`}
                      onClick={() => {
                        setMenuAberto(false);
                        if (statusLoja === 'open') {
                          const abertos = pedidos.filter(p => p.statusPedido !== 'Concluido');
                          if (abertos.length > 0) { setModalLojaAviso(abertos.length); return; }
                        }
                        setModalFecharLoja(true);
                      }}
                    >
                      {statusLoja === 'open' ? '🔒 Fechar loja' : '🔓 Abrir loja'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <button className="btn-sair" onClick={sair}>Sair</button>
        </div>
      </div>

      <div className="dashboard-layout">

        {perfil === 'admin' && (
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
        )}

        <div className="dashboard-filtros">
          {(perfil === 'motoboy' ? FILTROS_MOTOBOY : FILTROS_ADMIN).map(f => {
            const count =
              f.valor === 'aguardando-retirada' ? pedidos.filter(p => p.statusPedido === 'Saiu para entrega' && !p.motoboyPegou).length :
              f.valor === 'em-entrega'          ? pedidos.filter(p => p.statusPedido === 'Saiu para entrega' && p.motoboyPegou).length :
              f.valor === 'pronto-retirada'     ? pedidos.filter(p => p.statusPedido === 'Saiu para entrega' && p.tipoEntrega === 'Retirada').length :
              f.valor === 'Saiu para entrega'    ? pedidos.filter(p => p.statusPedido === 'Saiu para entrega' && p.tipoEntrega === 'Entrega').length :
              f.valor !== 'todos'               ? pedidos.filter(p => p.statusPedido === f.valor).length : null;
            return (
              <button key={f.valor} className={`filtro-btn ${filtro === f.valor ? 'ativo' : ''}`} onClick={() => setFiltro(f.valor)}>
                {f.label}
                {count !== null && <span style={{ marginLeft: 6, opacity: 0.7 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {loading && <div className="dashboard-loading"><div className="dashboard-spinner" /><p>Carregando pedidos...</p></div>}
        {erro     && <div className="dashboard-vazio">⚠️ {erro}</div>}
        {!loading && !erro && pedidosFiltrados.length === 0 && <div className="dashboard-vazio">Nenhum pedido encontrado.</div>}

        <div className="pedidos-lista">
          {!loading && !erro && pedidosFiltrados.map(pedido => {
            const subtotal    = pedido.pizzas.reduce((s, p) => s + calcularTotalItem(p), 0);
            const cupons      = pedido.cupons?.length > 0 ? pedido.cupons : (pedido.cupom ? [pedido.cupom] : []);
            const freteGratis = cupons.some(c => c.tipo === 'frete_gratis');
            const taxaEfetiva = pedido.tipoEntrega === 'Retirada' || freteGratis
              ? 0
              : Number(pedido.taxaEntrega ?? taxaEntrega ?? 0);
            const desconto    = cupons.reduce((s, c) => s + Number(c.desconto || 0), 0);
            const total       = Math.max(0, subtotal + taxaEfetiva - desconto);

            return (
              <div key={pedido._id} className="pedido-card">

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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={`pedido-status-badge ${statusClass(pedido.statusPedido)}`}>
                      {pedido.statusPedido === 'Cancelado' ? '🚫 Cancelado' : labelStatus(pedido.statusPedido, pedido.tipoEntrega)}
                    </span>
                    {perfil === 'motoboy' && pedido.statusPedido === 'Saiu para entrega' && pedido.tipoEntrega === 'Entrega' && !pedido.motoboyPegou && (
                      <span className="badge-aguardando-retirada">⏳ Aguardando retirada</span>
                    )}
                  </div>
                </div>

                <div className="pedido-card-body">
                  <div className="pedido-itens">
                    {pedido.pizzas.map((pizza, i) => (
                      <div key={i} className="pedido-item-linha">
                        <strong>{pizza.quantidade}× {pizza.nomeProduto || pizza.produtoId?.nome || 'Produto'}</strong>
                        {pizza.tamanho && ` · ${pizza.tamanho}`}
                        <div className="pedido-item-detalhe">
                          {pizza.sabores?.join(', ')}
                          {pizza.adicionais?.length > 0 && ` + ${pizza.adicionais.map(a => a.nome).join(', ')}`}
                          {pizza.observacao && ` — ${pizza.observacao}`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pedido-card-direita">
                    <div className="pedido-valores-detalhe" style={{ textAlign: 'right', marginBottom: 8, borderTop: '1px solid #eee', paddingTop: 8 }}>

                      <div style={{ fontSize: '0.75rem', color: '#888' }}>
                        Subtotal: {formatarPreco(subtotal)}
                      </div>

                      {pedido.tipoEntrega === 'Entrega' && (
                        <div style={{ fontSize: '0.75rem', color: freteGratis ? '#27ae60' : '#666' }}>
                          Entrega: {freteGratis ? 'Grátis 🎉' : formatarPreco(taxaEfetiva)}
                        </div>
                      )}

                      {cupons.filter(c => c.tipo !== 'frete_gratis' && c.desconto > 0).map((c, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', color: '#27ae60', fontWeight: 'bold' }}>
                          {c.codigo}: − {formatarPreco(c.desconto)}
                        </div>
                      ))}
                      {cupons.filter(c => c.tipo === 'frete_gratis').map((c, i) => (
                        <div key={i} style={{ fontSize: '0.75rem', color: '#27ae60', fontWeight: 'bold' }}>
                          {c.codigo}: frete grátis
                        </div>
                      ))}

                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#e03c1f', marginTop: 4 }}>
                        Total: {formatarPreco(total)}
                      </div>
                    </div>

                    <div className="pedido-contato">
                      <strong>{pedido.contato?.nome}</strong>
                      {pedido.contato?.telefone}
                      {pedido.enderecoEntrega?.bairro && (
                        <span style={{ display: 'block' }}>{pedido.enderecoEntrega.bairro}</span>
                      )}
                      {perfil === 'motoboy' && pedido.enderecoEntrega?.rua && (
                        <button className="btn-mapa" onClick={() => abrirMapa(pedido.enderecoEntrega)}>
                          🗺️ Abrir no Maps
                        </button>
                      )}
                      {pedido.contato?.telefone && (
                        <a className="btn-ligar" href={`tel:${pedido.contato.telefone.replace(/\D/g, '')}`}>
                          📞 Ligar
                        </a>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: 4 }}>
                      💳 {pedido.pagamento}
                    </div>

                    {perfil === 'motoboy' ? (
                      pedido.statusPedido === 'Saiu para entrega' ? (
                        <>
                          {pedido.tipoEntrega === 'Retirada' ? (
                            // Retirada: cliente vem buscar, só confirmar
                            <>
                              <span className="badge-aguardando-retirada">🔔 Pronto para retirada</span>
                              <button className="btn-proximo-status" onClick={() => {
                                if (pedido.codigoSeguranca) setModalCodigo({ pedido });
                                else atualizarStatus(pedido._id, 'Concluido');
                              }}>
                                Confirmar retirada
                              </button>
                            </>
                          ) : !pedido.motoboyPegou ? (
                            <button className="btn-pegou" onClick={() => pegarPizza(pedido._id)}>
                              🍕 Peguei a pizza
                            </button>
                          ) : (
                            <>
                              <span className="badge-pegou">✓ Pizza retirada</span>
                              <button className="btn-proximo-status" onClick={() => {
                                if (pedido.codigoSeguranca) setModalCodigo({ pedido });
                                else atualizarStatus(pedido._id, 'Concluido');
                              }}>
                                Confirmar Entrega
                              </button>
                              <button
                                className={`btn-chat ${naoLidas[pedido._id] ? 'piscando' : ''}`}
                                onClick={() => toggleChat(pedido._id)}
                              >
                                {chatPedidoId === pedido._id ? '✕ Fechar chat' : '💬 Chat com cliente'}
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#bbb', fontStyle: 'italic' }}>
                          {pedido.statusPedido === 'Concluido'
                            ? (pedido.tipoEntrega === 'Retirada' ? 'Retirada concluída' : 'Entrega concluída')
                            : (pedido.tipoEntrega === 'Retirada' ? 'Aguardando preparo' : 'Aguardando saída para entrega')}
                        </span>
                      )
                    ) : (
                      <>
                        <select
                          className="select-status"
                          value={pedido.statusPedido}
                          onChange={e => handleMudarStatus(pedido, e.target.value)}
                        >
                          {TODOS_STATUS.map(s => (
                            <option key={s.valor} value={s.valor}>{s.label}</option>
                          ))}
                        </select>

                        {PROXIMO_STATUS[pedido.statusPedido] && (
                          <button
                            className="btn-proximo-status"
                            onClick={() => handleMudarStatus(pedido, PROXIMO_STATUS[pedido.statusPedido].valor)}
                          >
                            {labelProximoStatus(pedido.statusPedido, pedido.tipoEntrega)}
                          </button>
                        )}

                        <button
                          className={`btn-chat ${naoLidas[pedido._id] ? 'piscando' : ''}`}
                          onClick={() => toggleChat(pedido._id)}
                        >
                          {chatPedidoId === pedido._id ? '✕ Fechar chat' : '💬 Chat com cliente'}
                        </button>
                        {pedido.statusPedido !== 'Concluido' && pedido.statusPedido !== 'Cancelado' && (
                          <button
                            className="btn-cancelar-pedido"
                            onClick={() => setModalCancelar({ pedido })}
                          >
                            🚫 Cancelar pedido
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {pedido.statusPedido === 'Cancelado' && pedido.cancelamento?.motivoCancelamento && (
                  <div className="pedido-cancelamento-info">
                    <span className="cancelamento-icone">🚫</span>
                    <div>
                      <div className="cancelamento-titulo">Pedido cancelado pela pizzaria</div>
                      <div className="cancelamento-motivo">"{pedido.cancelamento.motivoCancelamento}"</div>
                    </div>
                  </div>
                )}

                {perfil === 'admin' && pedido.historicoStatus?.length > 0 && (
                  <div className="pedido-historico">
                    <div className="pedido-historico-titulo">📋 Histórico de alterações</div>
                    {pedido.historicoStatus.map((h, i) => (
                      <div key={i} className="pedido-historico-item">
                        <span className="historico-seta">{h.de} → {h.para}</span>
                        <span className="historico-motivo">"{h.motivo}"</span>
                        <span className="historico-hora">
                          {new Date(h.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {chatPedidoId === pedido._id && (perfil === 'admin' || pedido.statusPedido === 'Saiu para entrega') && (
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
            );
          })}
        </div>
      </div>

      {modalCancelar && (
        <ModalCancelar
          pedido={modalCancelar.pedido}
          onConfirmar={motivo => {
            cancelarPedido(modalCancelar.pedido, motivo);
            setModalCancelar(null);
          }}
          onCancelar={() => setModalCancelar(null)}
        />
      )}

      {modalCodigo && (
        <ModalCodigo
          pedido={modalCodigo.pedido}
          onConfirmar={() => {
            atualizarStatus(modalCodigo.pedido._id, 'Concluido');
            setModalCodigo(null);
          }}
          onCancelar={() => setModalCodigo(null)}
        />
      )}

      {modalRetrocesso && (
        <ModalRetrocesso
          pedido={modalRetrocesso.pedido}
          novoStatus={modalRetrocesso.novoStatus}
          onConfirmar={confirmarRetrocesso}
          onCancelar={() => setModalRetrocesso(null)}
        />
      )}

      {modalLojaAviso && (
        <div className="modal-overlay" onClick={() => setModalLojaAviso(false)}>
          <div className="modal-retrocesso" onClick={e => e.stopPropagation()}>
            <div className="modal-retrocesso-header">
              <span>⚠️ Não é possível fechar</span>
              <button onClick={() => setModalLojaAviso(false)}>✕</button>
            </div>
            <div className="modal-retrocesso-body" style={{ textAlign: 'center', padding: '28px 24px 16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: 6 }}>
                Você tem <span style={{ color: '#e03c1f' }}>{modalLojaAviso} pedido{modalLojaAviso > 1 ? 's' : ''}</span> em andamento
              </p>
              <p style={{ fontSize: '0.82rem', color: '#999' }}>Conclua todos os pedidos antes de fechar a loja.</p>
            </div>
            <div className="modal-retrocesso-footer">
              <button className="btn-confirmar-retrocesso" onClick={() => setModalLojaAviso(false)}>Entendido</button>
            </div>
          </div>
        </div>
      )}

      {modalFecharLoja && (
        <div className="modal-overlay" onClick={() => setModalFecharLoja(false)}>
          <div className="modal-retrocesso" onClick={e => e.stopPropagation()}>
            <div className="modal-retrocesso-header">
              <span>{statusLoja === 'open' ? '🔒 Fechar loja' : '🔓 Abrir loja'}</span>
              <button onClick={() => setModalFecharLoja(false)}>✕</button>
            </div>
            <div className="modal-retrocesso-body" style={{ textAlign: 'center', padding: '28px 24px 16px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{statusLoja === 'open' ? '🔒' : '🔓'}</div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: '#222', marginBottom: 6 }}>
                {statusLoja === 'open' ? 'Tem certeza que deseja fechar a loja?' : 'Tem certeza que deseja abrir a loja?'}
              </p>
              <p style={{ fontSize: '0.82rem', color: '#999' }}>
                {statusLoja === 'open' ? 'Os clientes não conseguirão fazer novos pedidos.' : 'A loja voltará a aceitar pedidos.'}
              </p>
            </div>
            <div className="modal-retrocesso-footer">
              <button className="btn-cancelar-retrocesso" onClick={() => setModalFecharLoja(false)}>Cancelar</button>
              <button className="btn-confirmar-retrocesso" onClick={confirmarFecharLoja}>
                {statusLoja === 'open' ? 'Fechar loja' : 'Abrir loja'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}