import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './StatusPedido.css';
import Chat from '../Chat/Chat.jsx';
import { useChat } from '../Chat/useChat.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

// Ordem e descrição de cada status
const STATUS_STEPS = [
  {
    key:    'Aguardando confirmacao',
    icone:  '⏳',
    titulo: 'Aguardando confirmacao',
    desc:   'O restaurante vai confirmar seu pedido em breve',
  },
  {
    key:    'Preparando',
    icone:  '👨‍🍳',
    titulo: 'Preparando',
    desc:   'Seu pedido está sendo preparado com carinho',
  },
  {
    key:    'Saiu para entrega',
    icone:  '🛵',
    titulo: 'Saiu para entrega',
    desc:   'Seu pedido está a caminho!',
  },
  {
    key:    'Concluido',
    icone:  '✅',
    titulo: 'Entregue',
    desc:   'Pedido entregue. Bom apetite!',
  },
];

const STATUS_STEPS_RETIRADA = [
  {
    key:    'Aguardando confirmacao',
    icone:  '⏳',
    titulo: 'Aguardando confirmacao',
    desc:   'O restaurante vai confirmar seu pedido em breve',
  },
  {
    key:    'Preparando',
    icone:  '👨‍🍳',
    titulo: 'Preparando',
    desc:   'Seu pedido está sendo preparado',
  },
  {
    key:    'Saiu para entrega',
    icone:  '🔔',
    titulo: 'Pronto para retirada',
    desc:   'Pode vir buscar no balcão!',
  },
  {
    key:    'Concluido',
    icone:  '✅',
    titulo: 'Retirado',
    desc:   'Pedido retirado. Bom apetite!',
  },
];

function indiceStatus(statusAtual) {
  const ordem = ['Aguardando confirmacao', 'Preparando', 'Saiu para entrega', 'Concluido'];
  return ordem.indexOf(statusAtual);
}

// Cronômetro regressivo
function useCronometro(minutos) {
  const totalSegundos = minutos * 60;
  const [segundosRestantes, setSegundosRestantes] = useState(totalSegundos);
  const intervalo = useRef(null);

  useEffect(() => {
    setSegundosRestantes(minutos * 60);
  }, [minutos]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    intervalo.current = setInterval(() => {
      setSegundosRestantes((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(intervalo.current);
  }, [segundosRestantes]);

  const min = Math.floor(segundosRestantes / 60).toString().padStart(2, '0');
  const seg = (segundosRestantes % 60).toString().padStart(2, '0');

  return { display: `${min}:${seg}`, encerrado: segundosRestantes === 0 };
}

export default function StatusPedido() {
  const { pedidoId }  = useParams();
  const navigate      = useNavigate();

  const [pedido, setPedido]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState(null);

  const chat = useChat(pedidoId, 'cliente');
  const tempo = pedido?.tempoEsperaEstimado ?? 40;
  const { display: timerDisplay, encerrado } = useCronometro(tempo);

  useEffect(() => {
    async function buscarPedido() {
      try {
        const res  = await fetch(`${API}/pedidos/${pedidoId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || 'Pedido não encontrado');
        setPedido(data);
      } catch (err) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    buscarPedido();
  }, [pedidoId]);

  if (loading) {
    return (
      <div className="status-page">
        <div className="status-loading">
          <div className="status-spinner" />
          <p>Buscando seu pedido...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="status-page">
        <div className="status-erro">
          <p>⚠️ {erro}</p>
          <button className="btn-tentar-novamente" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const statusAtual  = pedido.statusPedido;
  const idxAtual     = indiceStatus(statusAtual);
  const ehRetirada   = pedido.tipoEntrega === 'Retirada';
  const steps        = ehRetirada ? STATUS_STEPS_RETIRADA : STATUS_STEPS;
  const pedidoPronto = statusAtual === 'Concluido';

  return (
    <div className="status-page">

      {/* Header */}
      <div className="status-header">
        <button className="status-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <span className="status-header-titulo">Acompanhar Pedido</span>
      </div>

      <div className="status-layout">

        {/* Número do pedido */}
        <div className="status-card">
          <div className="status-numero-wrapper">
            <div>
              <div className="status-numero-label">Número do pedido</div>
              <div className="status-numero-valor">
                #{pedido._id.toString().slice(-5).toUpperCase()}
              </div>
            </div>
            <span className="status-numero-icone">🍕</span>
          </div>
        </div>

        {/* Cronômetro */}
        {!pedidoPronto && (
          <div className="status-card status-timer-card">
            <div className="status-timer-label">
              {ehRetirada ? 'Pronto para retirada em' : 'Tempo estimado de entrega'}
            </div>
            <div className="status-timer-valor">
              {encerrado ? '00:00' : timerDisplay}
            </div>
            <div className="status-timer-desc">
              {encerrado
                ? 'Já deve estar chegando! 🚀'
                : `Estimativa de ${tempo} minutos`}
            </div>
          </div>
        )}

        {pedidoPronto && (
          <div className="status-card" style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', textAlign: 'center', padding: '28px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>
              {ehRetirada ? 'Pronto para retirada!' : 'Pedido entregue!'}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#86efac' }}>Bom apetite! 🍕</div>
          </div>
        )}

        {/* Steps de status */}
        <div className="status-card">
          <div className="status-resumo-titulo">Status do pedido</div>
          <div className="status-steps">
            {steps.map((step, i) => {
              const concluido = i < idxAtual;
              const ativo     = i === idxAtual;
              const pendente  = i > idxAtual;
              return (
                <div
                  key={step.key}
                  className={`status-step ${concluido ? 'concluido' : ''} ${ativo ? 'ativo' : ''} ${pendente ? 'pendente' : ''}`}
                >
                  <div className="status-step-bolinha">
                    {concluido ? '✓' : step.icone}
                  </div>
                  <div className="status-step-info">
                    <div className="status-step-titulo">{step.titulo}</div>
                    {(ativo || concluido) && (
                      <div className="status-step-desc">{step.desc}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalhes da entrega */}
        <div className="status-card">
          <div className="status-resumo-titulo">Detalhes</div>

          <div className="status-detalhe-linha">
            <span className="status-detalhe-icone">{ehRetirada ? '🏪' : '🛵'}</span>
            <div className="status-detalhe-texto">
              <strong>Tipo de entrega</strong>
              {ehRetirada ? 'Retirada na loja' : `Entrega — ${pedido.enderecoEntrega?.rua}, ${pedido.enderecoEntrega?.numero} – ${pedido.enderecoEntrega?.bairro}`}
            </div>
          </div>

          <div className="status-detalhe-linha">
            <span className="status-detalhe-icone">💳</span>
            <div className="status-detalhe-texto">
              <strong>Pagamento</strong>
              {pedido.pagamento}
            </div>
          </div>

          <div className="status-detalhe-linha">
            <span className="status-detalhe-icone">👤</span>
            <div className="status-detalhe-texto">
              <strong>Cliente</strong>
              {pedido.contato?.nome} · {pedido.contato?.telefone}
            </div>
          </div>
        </div>

        {/* Resumo dos itens */}
        <div className="status-card">
          <div className="status-resumo-titulo">Itens do pedido</div>
          {pedido.pizzas.map((pizza, i) => (
            <div key={i} className="status-resumo-item">
              <div className="status-resumo-item-info">
                <div className="status-resumo-item-nome">
                  {pizza.quantidade}× {pizza.produtoId?.nome || 'Pizza'}
                </div>
                <div className="status-resumo-item-detalhe">
                  {pizza.tamanho}
                  {pizza.sabores?.length > 0 && ` · ${pizza.sabores.join(', ')}`}
                  {pizza.adicionais?.length > 0 && ` · + ${pizza.adicionais.map(a => a.nome).join(', ')}`}
                  {pizza.observacao && ` · Obs: ${pizza.observacao}`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat */}
        <div className="status-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <div className="status-resumo-titulo" style={{ marginBottom: 0 }}>
              💬 Falar com a pizzaria
            </div>
          </div>
          <Chat
            mensagens={chat.mensagens}
            texto={chat.texto}
            setTexto={chat.setTexto}
            enviar={chat.enviar}
            handleKeyDown={chat.handleKeyDown}
            autorLocal="cliente"
            carregando={chat.carregando}
          />
        </div>

        {/* Botão WhatsApp */}
        <button
          className="status-btn-whatsapp"
          onClick={() => {
            const link = window.location.href;
            const texto = `Acompanhe meu pedido #${pedido._id.toString().slice(-5).toUpperCase()} aqui: ${link}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
          }}
        >
          <span>📲</span> Compartilhar link no WhatsApp
        </button>

        {/* Botão voltar */}
        <button
          className="status-btn-cardapio"
          onClick={() => navigate(-3)}
        >
          🍕 Fazer novo pedido
        </button>

      </div>
    </div>
  );
}