import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Statuspedido.css';
import Chat from '../Chat/Chat.jsx';
import { useChat } from '../Chat/useChat.js';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

const STATUS_STEPS = [
  { key: 'Aguardando confirmacao', icone: '⏳', titulo: 'Aguardando confirmação', desc: 'O restaurante vai confirmar seu pedido em breve' },
  { key: 'Preparando',             icone: '👨‍🍳', titulo: 'Preparando',            desc: 'Seu pedido está sendo preparado com carinho' },
  { key: 'Saiu para entrega',      icone: '🛵', titulo: 'Saiu para entrega',      desc: 'Seu pedido está a caminho!' },
  { key: 'Concluido',              icone: '✅', titulo: 'Entregue',               desc: 'Pedido entregue. Bom apetite!' },
];

const STATUS_STEPS_RETIRADA = [
  { key: 'Aguardando confirmacao', icone: '⏳', titulo: 'Aguardando confirmação', desc: 'O restaurante vai confirmar seu pedido em breve' },
  { key: 'Preparando',             icone: '👨‍🍳', titulo: 'Preparando',            desc: 'Seu pedido está sendo preparado' },
  { key: 'Saiu para entrega',      icone: '🔔', titulo: 'Pronto para retirada',   desc: 'Pode vir buscar no balcão!' },
  { key: 'Concluido',              icone: '✅', titulo: 'Retirado',               desc: 'Pedido retirado. Bom apetite!' },
];

function indiceStatus(statusAtual) {
  return ['Aguardando confirmacao', 'Preparando', 'Saiu para entrega', 'Concluido'].indexOf(statusAtual);
}

function useCronometro(minutos) {
  const [segundosRestantes, setSegundosRestantes] = useState(minutos * 60);
  const intervalo = useRef(null);

  useEffect(() => { setSegundosRestantes(minutos * 60); }, [minutos]);

  useEffect(() => {
    if (segundosRestantes <= 0) return;
    intervalo.current = setInterval(() => setSegundosRestantes(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(intervalo.current);
  }, [segundosRestantes]);

  const min = Math.floor(segundosRestantes / 60).toString().padStart(2, '0');
  const seg = (segundosRestantes % 60).toString().padStart(2, '0');
  return { display: `${min}:${seg}`, encerrado: segundosRestantes === 0 };
}

// ── Componente de avaliação ──
function Avaliacao({ pedidoId, pizzariaId, jaAvaliou, notaInicial }) {
  const [hover, setHover]         = useState(0);
  const [nota, setNota]           = useState(notaInicial || 0);
  const [enviado, setEnviado]     = useState(!!notaInicial);
  const [enviando, setEnviando]   = useState(false);
  const [erro, setErro]           = useState(null);

  const LABELS = ['', 'Péssimo 😞', 'Ruim 😕', 'Ok 😐', 'Bom 😊', 'Excelente 🤩'];

  async function enviar(estrela) {
    if (enviado) return;
    setNota(estrela);
    setEnviando(true);
    setErro(null);
    try {
      const res  = await fetch(`${API}/avaliacoes/${pedidoId}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nota: estrela, pizzariaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao enviar');
      setEnviado(true);
    } catch (err) {
      setErro(err.message);
      setNota(0);
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="avaliacao-enviada">
        <div className="avaliacao-enviada-estrelas">
          {[1,2,3,4,5].map(i => (
            <span key={i} className={`estrela-static ${i <= nota ? 'ativa' : ''}`}>★</span>
          ))}
        </div>
        <div className="avaliacao-enviada-msg">Obrigado pela avaliação! 🙏</div>
      </div>
    );
  }

  return (
    <div className="avaliacao-wrapper">
      <div className="avaliacao-titulo">Como foi sua experiência?</div>
      <div className="avaliacao-estrelas">
        {[1,2,3,4,5].map(i => (
          <button
            key={i}
            className={`estrela-btn ${i <= (hover || nota) ? 'ativa' : ''}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => enviar(i)}
            disabled={enviando}
          >
            ★
          </button>
        ))}
      </div>
      {(hover || nota) > 0 && (
        <div className="avaliacao-label">{LABELS[hover || nota]}</div>
      )}
      {erro && <div className="avaliacao-erro">⚠️ {erro}</div>}
    </div>
  );
}

export default function StatusPedido() {
  const { pedidoId } = useParams();
  const navigate     = useNavigate();

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

  if (loading) return (
    <div className="status-page">
      <div className="status-loading"><div className="status-spinner" /><p>Buscando seu pedido...</p></div>
    </div>
  );

  if (erro) return (
    <div className="status-page">
      <div className="status-erro">
        <p>⚠️ {erro}</p>
        <button className="btn-tentar-novamente" onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    </div>
  );

  const statusAtual     = pedido.statusPedido;
  const idxAtual        = indiceStatus(statusAtual);
  const ehRetirada      = pedido.tipoEntrega === 'Retirada';
  const steps           = ehRetirada ? STATUS_STEPS_RETIRADA : STATUS_STEPS;
  const pedidoPronto    = statusAtual === 'Concluido';
  const pedidoCancelado = statusAtual === 'Cancelado';
  const pizzariaId      = pedido.pizzariaId || pedido.pizzas?.[0]?.produtoId?.pizzariaId;

  if (pedidoCancelado) return (
    <div className="status-page">
      <div className="status-header">
        <button className="status-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <span className="status-header-titulo">Pedido Cancelado</span>
      </div>
      <div className="status-layout">
        <div className="status-card status-cancelado-card">
          <div className="status-cancelado-icone">🚫</div>
          <div className="status-cancelado-titulo">Pedido cancelado</div>
          <div className="status-cancelado-numero">#{pedido._id.toString().slice(-5).toUpperCase()}</div>
          {pedido.cancelamento?.motivoCancelamento && (
            <>
              <div className="status-cancelado-label">Motivo informado pela pizzaria:</div>
              <div className="status-cancelado-motivo">"{pedido.cancelamento.motivoCancelamento}"</div>
            </>
          )}
          <div className="status-cancelado-desc">
            Se tiver dúvidas, entre em contato com a pizzaria.
          </div>
        </div>
        <button className="status-btn-cardapio" onClick={() => navigate(`/${pizzariaId}`)}>
          🍕 Fazer novo pedido
        </button>
      </div>
    </div>
  );

  return (
    <div className="status-page">


      <div className="status-layout">

        {/* Número do pedido */}
        <div className="status-card">
          <div className="status-numero-wrapper">
            <div>
              <div className="status-numero-label">Número do pedido</div>
              <div className="status-numero-valor">#{pedido._id.toString().slice(-5).toUpperCase()}</div>
            </div>
            <span className="status-numero-icone">🍕</span>
          </div>
        </div>

        {/* Código de segurança */}
        {pedido.codigoSeguranca && (
          <div className="status-card status-codigo-card">
            <div className="status-codigo-label">🔐 Código de segurança</div>
            <div className="status-codigo-valor">{pedido.codigoSeguranca}</div>
            <div className="status-codigo-desc">Informe este código ao receber o pedido</div>
          </div>
        )}

        {/* Cronômetro ou concluído */}
        {!pedidoPronto ? (
          <div className="status-card status-timer-card">
            <div className="status-timer-label">
              {ehRetirada ? 'Pronto para retirada em' : 'Tempo estimado de entrega'}
            </div>
            <div className="status-timer-valor">{encerrado ? '00:00' : timerDisplay}</div>
            <div className="status-timer-desc">
              {encerrado ? 'Já deve estar chegando! 🚀' : `Estimativa de ${tempo} minutos`}
            </div>
          </div>
        ) : (
          <div className="status-card status-concluido-card">
            <div className="status-concluido-icone">✅</div>
            <div className="status-concluido-titulo">
              {ehRetirada ? 'Pronto para retirada!' : 'Pedido entregue!'}
            </div>
            <div className="status-concluido-sub">Bom apetite! 🍕</div>

            {/* ── Avaliação — só aparece quando Concluído ── */}
            <div className="status-concluido-divider" />
            <Avaliacao
              pedidoId={pedidoId}
              pizzariaId={pizzariaId}
              notaInicial={pedido.avaliacao}
            />
          </div>
        )}

        {/* Steps */}
        <div className="status-card">
          <div className="status-resumo-titulo">Status do pedido</div>
          <div className="status-steps">
            {steps.map((step, i) => {
              const concluido = i < idxAtual;
              const ativo     = i === idxAtual;
              const pendente  = i > idxAtual;
              return (
                <div key={step.key} className={`status-step ${concluido ? 'concluido' : ''} ${ativo ? 'ativo' : ''} ${pendente ? 'pendente' : ''}`}>
                  <div className="status-step-bolinha">{concluido ? '✓' : step.icone}</div>
                  <div className="status-step-info">
                    <div className="status-step-titulo">{step.titulo}</div>
                    {(ativo || concluido) && <div className="status-step-desc">{step.desc}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detalhes */}
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

        {/* Itens */}
        <div className="status-card">
          <div className="status-resumo-titulo">Itens do pedido</div>
          {pedido.pizzas.map((pizza, i) => (
            <div key={i} className="status-resumo-item">
              <div className="status-resumo-item-info">
                <div className="status-resumo-item-nome">
                  {pizza.quantidade}× {pizza.nomeProduto || pizza.produtoId?.nome || 'Produto'}
                </div>
                <div className="status-resumo-item-detalhe">
                  {pizza.tamanho && `${pizza.tamanho}`}
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
            <div className="status-resumo-titulo" style={{ marginBottom: 0 }}>💬 Falar com a pizzaria</div>
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

        <button className="status-btn-whatsapp" onClick={() => {
          const link  = window.location.href;
          const texto = `Acompanhe meu pedido #${pedido._id.toString().slice(-5).toUpperCase()} aqui: ${link}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }}>
          <span>📲</span> Compartilhar link no WhatsApp
        </button>

        <button className="status-btn-cardapio" onClick={() => navigate(`/${pizzariaId}`)}>
          🍕 Fazer novo pedido
        </button>

      </div>
    </div>
  );
}