import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PainelAnalitico.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatarPreco(v) {
  return `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
}
function formatarData(d) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function LinhaGrafico({ dados, campo, cor = '#e03c1f' }) {
  const max = Math.max(...dados.map(d => d[campo] || 0), 1);
  const w = 100, h = 56;
  if (dados.length < 2) return null;
  const pts = dados.map((d, i) => {
    const x = (i / (dados.length - 1)) * w;
    const y = h - ((d[campo] || 0) / max) * (h - 8) - 4;
    return [x, y];
  });
  const linePath  = 'M' + pts.map(p => p.join(',')).join(' L');
  const areaPath  = linePath + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="linha-grafico">
      <defs>
        <linearGradient id={`g${campo}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={cor} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#g${campo})`} />
      <path d={linePath} fill="none" stroke={cor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill={cor} />)}
    </svg>
  );
}

export default function PainelAnalitico() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();
  const token          = localStorage.getItem('token');

  const [dados, setDados]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState(null);
  const [periodo, setPeriodo] = useState(7);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    setLoading(true); setErro(null);
    fetch(`${API}/financeiro?pizzariaId=${pizzariaId}&dias=${periodo}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDados(d); else throw new Error(d.erro || 'Erro'); })
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, [pizzariaId, periodo]);

  const m = useMemo(() => {
    if (!dados.length) return null;
    const fat    = dados.reduce((s, d) => s + (d.faturamentoTotal || 0), 0);
    const pedidos= dados.reduce((s, d) => s + (d.totalPedidos || 0), 0);
    const entrega= dados.reduce((s, d) => s + (d.pedidosEntrega || 0), 0);
    const retira = dados.reduce((s, d) => s + (d.pedidosRetirada || 0), 0);
    const ticket = pedidos > 0 ? fat / pedidos : 0;
    const avs    = dados.filter(d => d.avaliacaoMediaDia).map(d => d.avaliacaoMediaDia);
    const avMedia= avs.length ? avs.reduce((s, v) => s + v, 0) / avs.length : null;
    const melhor = [...dados].sort((a, b) => (b.faturamentoTotal||0)-(a.faturamentoTotal||0))[0];
    const prodMap= {};
    dados.forEach(d => (d.topProdutos||[]).forEach(p => {
      if (!prodMap[p.nome]) prodMap[p.nome] = { nome: p.nome, quantidade: 0, faturamento: 0 };
      prodMap[p.nome].quantidade  += p.quantidade  || 0;
      prodMap[p.nome].faturamento += p.faturamento || 0;
    }));
    const top = Object.values(prodMap).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
    return { fat, pedidos, entrega, retira, ticket, avMedia, melhor, top };
  }, [dados]);

  const estrelas = n => '★'.repeat(Math.round(n||0)) + '☆'.repeat(5-Math.round(n||0));

  return (
    <div className="painel-page">
      <div className="painel-header">
        <button className="painel-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <div>
          <div className="painel-titulo">📊 Painel Analítico</div>
          <div className="painel-sub">Visão geral do desempenho</div>
        </div>
        <div className="painel-tabs">
          {[7,15,30].map(d => (
            <button key={d} className={`painel-tab ${periodo===d?'ativo':''}`} onClick={() => setPeriodo(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="painel-loading"><div className="painel-spinner"/><p>Carregando...</p></div>}
      {erro    && <div className="painel-erro">⚠️ {erro}</div>}
      {!loading && !erro && !dados.length && (
        <div className="painel-vazio">
          <div style={{fontSize:'3rem',marginBottom:12}}>📭</div>
          <div>Nenhum fechamento registrado nos últimos {periodo} dias.</div>
          <div style={{fontSize:'0.8rem',color:'#bbb',marginTop:6}}>Os dados aparecem após o fechamento do caixa no dashboard.</div>
        </div>
      )}

      {!loading && !erro && m && (
        <div className="painel-layout">

          {/* KPIs */}
          <div className="painel-kpis">
            <div className="kpi-card grande">
              <div className="kpi-icone">💰</div>
              <div className="kpi-info">
                <div className="kpi-label">Faturamento total</div>
                <div className="kpi-valor">{formatarPreco(m.fat)}</div>
              </div>
              <LinhaGrafico dados={dados} campo="faturamentoTotal" cor="#e03c1f" />
            </div>
            <div className="kpi-card">
              <div className="kpi-icone">📦</div>
              <div className="kpi-info">
                <div className="kpi-label">Pedidos</div>
                <div className="kpi-valor">{m.pedidos}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icone">🎯</div>
              <div className="kpi-info">
                <div className="kpi-label">Ticket médio</div>
                <div className="kpi-valor">{formatarPreco(m.ticket)}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icone">⭐</div>
              <div className="kpi-info">
                <div className="kpi-label">Avaliação média</div>
                <div className="kpi-valor">{m.avMedia ? m.avMedia.toFixed(1) : '—'}</div>
                {m.avMedia && <div className="kpi-estrelas">{estrelas(m.avMedia)}</div>}
              </div>
            </div>
          </div>

          {/* Gráfico faturamento */}
          <div className="painel-secao">
            <div className="painel-secao-titulo">💰 Faturamento por dia</div>
            <div className="gb-container">
              {dados.map((d, i) => {
                const max = Math.max(...dados.map(x => x.faturamentoTotal||0), 1);
                const pct = ((d.faturamentoTotal||0) / max) * 100;
                return (
                  <div key={i} className="gb-col" title={formatarPreco(d.faturamentoTotal)}>
                    <div className="gb-valor">{formatarPreco(d.faturamentoTotal)}</div>
                    <div className="gb-barra-wrap">
                      <div className="gb-barra" style={{height:`${Math.max(pct,3)}%`}} />
                    </div>
                    <div className="gb-label">{formatarData(d.data)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="painel-dupla">

            {/* Top produtos */}
            <div className="painel-secao">
              <div className="painel-secao-titulo">🏆 Top produtos</div>
              {m.top.length === 0
                ? <div className="painel-sem-dados">Sem dados</div>
                : m.top.map((p, i) => {
                  const pct = (p.quantidade / (m.top[0]?.quantidade||1)) * 100;
                  return (
                    <div key={p.nome} className="prod-item">
                      <div className="prod-rank">#{i+1}</div>
                      <div className="prod-info">
                        <div className="prod-nome">{p.nome}</div>
                        <div className="prod-barra-bg">
                          <div className="prod-barra" style={{width:`${pct}%`}} />
                        </div>
                      </div>
                      <div className="prod-nums">
                        <span className="prod-qtd">{p.quantidade}×</span>
                        <span className="prod-fat">{formatarPreco(p.faturamento)}</span>
                      </div>
                    </div>
                  );
                })
              }
            </div>

            {/* Entrega vs Retirada + Avaliações */}
            <div className="painel-secao">
              <div className="painel-secao-titulo">🛵 Entrega vs Retirada</div>
              {(() => {
                const tot = (m.entrega + m.retira) || 1;
                const pE  = (m.entrega / tot) * 100;
                const pR  = (m.retira  / tot) * 100;
                return (
                  <>
                    <div className="er-barra">
                      <div className="er-seg e" style={{width:`${pE}%`}} />
                      <div className="er-seg r" style={{width:`${pR}%`}} />
                    </div>
                    <div className="er-legenda">
                      <div className="er-item"><span className="er-dot e"/>Entrega <strong>{m.entrega} ({pE.toFixed(0)}%)</strong></div>
                      <div className="er-item"><span className="er-dot r"/>Retirada <strong>{m.retira} ({pR.toFixed(0)}%)</strong></div>
                    </div>
                  </>
                );
              })()}

              <div className="painel-secao-titulo" style={{marginTop:20}}>⭐ Avaliações por dia</div>
              {dados.filter(d => d.avaliacaoMediaDia).length === 0
                ? <div className="painel-sem-dados">Sem avaliações no período</div>
                : dados.filter(d => d.avaliacaoMediaDia).map((d, i) => (
                    <div key={i} className="av-item">
                      <span className="av-data">{formatarData(d.data)}</span>
                      <span className="av-stars">{estrelas(d.avaliacaoMediaDia)}</span>
                      <span className="av-nota">{Number(d.avaliacaoMediaDia).toFixed(1)}</span>
                      <span className="av-qtd">({d.totalAvaliacoesDia})</span>
                    </div>
                  ))
              }
            </div>
          </div>

          {/* Melhor dia */}
          {m.melhor && (
            <div className="painel-secao painel-melhor">
              <div className="painel-secao-titulo">🌟 Melhor dia do período</div>
              <div className="melhor-grid">
                {[
                  ['📅 Data',         new Date(m.melhor.data).toLocaleDateString('pt-BR')],
                  ['💰 Faturamento',  formatarPreco(m.melhor.faturamentoTotal)],
                  ['📦 Pedidos',      m.melhor.totalPedidos],
                  ['🎯 Ticket médio', formatarPreco(m.melhor.ticketMedio)],
                ].map(([label, val]) => (
                  <div key={label} className="melhor-item">
                    <div className="melhor-label">{label}</div>
                    <div className="melhor-val">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}