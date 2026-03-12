import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatarPreco(valor) {
  return `R$ ${Number(valor).toFixed(2).replace('.', ',')}`;
}

const TEMPO_ENTREGA  = '35–45 min';
const TEMPO_RETIRADA = '20–25 min';
const STEPS = ['Entrega', 'Dados', 'Pagamento', 'Resumo'];

const PAGAMENTO_MAP   = { online: 'Cartao online', dinheiro: 'Dinheiro na entrega', maquina: 'Dinheiro na entrega' };
const TIPO_ENTREGA_MAP = { entrega: 'Entrega', retirada: 'Retirada' };

export default function Checkout({ itens, subtotal, pizzariaId, onPedidoConfirmado }) {
  const navigate = useNavigate();

  const [step, setStep]                     = useState(0);
  const [tipoEntrega, setTipoEntrega]       = useState('entrega');
  const [cupom, setCupom]                   = useState('');
  const [cupomStatus, setCupomStatus]       = useState(null);
  const [cupomAplicado, setCupomAplicado]   = useState(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [pagamento, setPagamento]           = useState('online');
  const [troco, setTroco]                   = useState('');
  const [salvando, setSalvando]             = useState(false);
  const [erroSalvar, setErroSalvar]         = useState(null);
  const [buscandoCep, setBuscandoCep]       = useState(false);
  const [erroCep, setErroCep]               = useState(null);

  // Dados da pizzaria vindos da API
  const [taxaEntregaBase, setTaxaEntregaBase]     = useState(0);
  const [tempoEntregaBase, setTempoEntregaBase]   = useState(40);
  const [loadingPizzaria, setLoadingPizzaria]     = useState(true);

  const [dados, setDados] = useState({
    nome: '', telefone: '', cep: '', rua: '', numero: '', complemento: '', bairro: '',
  });

  // Busca dados reais da pizzaria
  useEffect(() => {
    if (!pizzariaId) { setLoadingPizzaria(false); return; }
    fetch(`${API}/pizzarias/${pizzariaId}`)
      .then(r => r.json())
      .then(data => {
        setTaxaEntregaBase(data.taxaEntrega ?? 0);
        setTempoEntregaBase(data.tempoMedioEntrega ?? 40);
      })
      .catch(() => {})
      .finally(() => setLoadingPizzaria(false));
  }, [pizzariaId]);

  // ── Cálculos ──
  const freteGratis = cupomAplicado?.tipo === 'frete_gratis';
  const taxaEntrega = tipoEntrega === 'retirada' || freteGratis ? 0 : taxaEntregaBase;

  let desconto = 0;
  if (cupomAplicado?.tipo === 'percentual') desconto = subtotal * (cupomAplicado.valor / 100);
  if (cupomAplicado?.tipo === 'fixo')       desconto = Math.min(cupomAplicado.valor, subtotal);

  const total         = Math.max(0, subtotal - desconto + taxaEntrega);
  const tempoEntrega  = `${tempoEntregaBase}–${tempoEntregaBase + 10} min`;
  const tempoEstimado = tipoEntrega === 'retirada' ? TEMPO_RETIRADA : tempoEntrega;

  function labelCupom() {
    if (!cupomAplicado) return '';
    if (cupomAplicado.tipo === 'frete_gratis') return 'Frete grátis!';
    if (cupomAplicado.tipo === 'percentual')   return `${cupomAplicado.valor}% de desconto!`;
    if (cupomAplicado.tipo === 'fixo')         return `${formatarPreco(cupomAplicado.valor)} de desconto!`;
    return '';
  }

  // ── Validações ──
  function stepValido(s) {
    if (s === 0) return true;
    if (s === 1) {
      if (tipoEntrega === 'retirada') return dados.nome && dados.telefone;
      return dados.nome && dados.telefone && dados.cep && dados.rua && dados.numero && dados.bairro;
    }
    return true;
  }

  function avancar() { if (step < STEPS.length - 1) setStep(s => s + 1); }
  function voltar()  { if (step > 0) setStep(s => s - 1); else navigate(-1); }

  // ── Cupom via API ──
  async function aplicarCupom() {
    const codigo = cupom.trim().toUpperCase();
    if (!codigo) return;
    setValidandoCupom(true);
    setCupomStatus(null);
    try {
      // Tenta pegar pizzariaId dos itens como fallback
      const pid = pizzariaId || itens[0]?.pizzariaId;
      const res  = await fetch(`${API}/cupons/validar?codigo=${codigo}&pizzariaId=${pid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Cupom inválido');
      // data = { _id, codigo, tipo, valor, ativo, pizzariaId }
      setCupomAplicado(data);
      setCupomStatus('ok');
    } catch {
      setCupomAplicado(null);
      setCupomStatus('erro');
    } finally {
      setValidandoCupom(false);
    }
  }

  function handleDados(e) {
    setDados(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function buscarCep(cep) {
    const limpo = cep.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    setBuscandoCep(true); setErroCep(null);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (data.erro) { setErroCep('CEP não encontrado.'); return; }
      setDados(prev => ({
        ...prev,
        rua:    data.logradouro || prev.rua,
        bairro: data.bairro     || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf         || prev.estado,
      }));
    } catch { setErroCep('Erro ao buscar CEP.'); }
    finally  { setBuscandoCep(false); }
  }

  async function confirmarPedido() {
    setErroSalvar(null); setSalvando(true);
    const body = {
      pizzas: itens.map(item => ({
        produtoId:   item.produtoId,
        nomeProduto: item.nomeProduto || '',
        preco:       item.preco || 0,
        tamanho:     item.tamanho || null,
        sabores:     item.sabores || [],
        adicionais:  (item.adicionais || []).map(a => ({ nome: a.nome, preco: a.preco, quantidade: 1 })),
        quantidade:  item.quantidade,
        observacao:  item.observacao || '',
      })),
      tipoEntrega: TIPO_ENTREGA_MAP[tipoEntrega],
      enderecoEntrega: tipoEntrega === 'entrega' ? {
        rua: dados.rua, numero: dados.numero, complemento: dados.complemento,
        bairro: dados.bairro, cep: dados.cep,
      } : null,
      contato:  { nome: dados.nome, telefone: dados.telefone },
      cupom: cupomAplicado ? {
        codigo:      cupomAplicado.codigo,
        tipo:        cupomAplicado.tipo,
        desconto,
        porcentagem: cupomAplicado.tipo === 'percentual' ? cupomAplicado.valor : 0,
        valido:      true,
      } : null,
      pagamento:           PAGAMENTO_MAP[pagamento],
      statusPedido:        'Aguardando confirmacao',
      tempoEsperaEstimado: tipoEntrega === 'retirada' ? Math.round(tempoEntregaBase * 0.6) : tempoEntregaBase,
      taxaEntrega,
    };
    try {
      const res  = await fetch(`${API}/pedidos`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao salvar pedido');
      if (onPedidoConfirmado) onPedidoConfirmado(data);
      navigate(`/status/${data._id}`);
    } catch (err) {
      setErroSalvar(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="checkout-page">

      <div className="checkout-header">
        <button className="checkout-btn-voltar" onClick={voltar}>←</button>
        <span className="checkout-header-titulo">Finalizar Pedido</span>
      </div>

      <div className="checkout-steps">
        {STEPS.map((label, i) => (
          <div key={label} className={`checkout-step ${i === step ? 'ativo' : ''} ${i < step ? 'concluido' : ''}`}>
            <div className="step-bolinha">{i < step ? '✓' : i + 1}</div>
            <span className="step-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="checkout-layout">

        {/* STEP 0 */}
        {step === 0 && (
          <>
            <div className="checkout-card">
              <div className="checkout-card-titulo"><span>🛵</span> Tipo de entrega</div>
              <div className="entrega-opcoes">
                <div className={`entrega-opcao ${tipoEntrega === 'entrega' ? 'selecionado' : ''}`} onClick={() => setTipoEntrega('entrega')}>
                  <div className="entrega-opcao-icone">🛵</div>
                  <div className="entrega-opcao-titulo">Entrega</div>
                  <div className="entrega-opcao-desc">
                    {loadingPizzaria ? '...' : taxaEntregaBase === 0 ? 'Grátis' : `Taxa: ${formatarPreco(taxaEntregaBase)}`}
                  </div>
                </div>
                <div className={`entrega-opcao ${tipoEntrega === 'retirada' ? 'selecionado' : ''}`} onClick={() => setTipoEntrega('retirada')}>
                  <div className="entrega-opcao-icone">🏪</div>
                  <div className="entrega-opcao-titulo">Retirada</div>
                  <div className="entrega-opcao-desc">Sem taxa</div>
                </div>
              </div>
            </div>

            <div className="checkout-card">
              <div className="checkout-card-titulo"><span>🏷️</span> Cupom de desconto</div>
              <div className="cupom-wrapper">
                <input
                  className={`cupom-input ${cupomStatus === 'ok' ? 'valido' : cupomStatus === 'erro' ? 'invalido' : ''}`}
                  type="text" placeholder="Digite seu cupom"
                  value={cupom}
                  onChange={e => { setCupom(e.target.value); setCupomStatus(null); setCupomAplicado(null); }}
                  onKeyDown={e => e.key === 'Enter' && aplicarCupom()}
                />
                <button className="btn-aplicar-cupom" onClick={aplicarCupom} disabled={!cupom.trim() || validandoCupom}>
                  {validandoCupom ? '...' : 'Aplicar'}
                </button>
              </div>
              {cupomStatus === 'ok'   && <div className="cupom-feedback ok">✓ {labelCupom()}</div>}
              {cupomStatus === 'erro' && <div className="cupom-feedback erro">✕ Cupom inválido ou inativo.</div>}
            </div>
          </>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="checkout-card">
            <div className="checkout-card-titulo"><span>📋</span> Seus dados</div>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Nome completo *</label>
                <input className="form-input" name="nome" placeholder="Ex: João Silva" value={dados.nome} onChange={handleDados} />
              </div>
              <div className="form-group full">
                <label className="form-label">Telefone / WhatsApp *</label>
                <input className="form-input" name="telefone" placeholder="(00) 00000-0000" value={dados.telefone} onChange={handleDados} />
              </div>
              {tipoEntrega === 'entrega' && (
                <>
                  <div className="form-group">
                    <label className="form-label">CEP *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className={`form-input ${erroCep ? 'input-erro' : ''}`}
                        name="cep" placeholder="00000-000" value={dados.cep} maxLength={9}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                          const fmt = val.length > 5 ? val.slice(0,5) + '-' + val.slice(5) : val;
                          setDados(prev => ({ ...prev, cep: fmt }));
                          if (val.length === 8) buscarCep(val);
                        }}
                      />
                      {buscandoCep && (
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#e03c1f' }}>
                          buscando...
                        </span>
                      )}
                    </div>
                    {erroCep && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: 4 }}>{erroCep}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Número *</label>
                    <input className="form-input" name="numero" placeholder="123" value={dados.numero} onChange={handleDados} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">Rua *</label>
                    <input className="form-input" name="rua" placeholder="Rua das Pizzas" value={dados.rua} onChange={handleDados} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro *</label>
                    <input className="form-input" name="bairro" placeholder="Centro" value={dados.bairro} onChange={handleDados} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Complemento</label>
                    <input className="form-input" name="complemento" placeholder="Apto, bloco..." value={dados.complemento} onChange={handleDados} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div className="checkout-card">
              <div className="checkout-card-titulo"><span>💳</span> Forma de pagamento</div>
              <div className="pagamento-opcoes">
                {[
                  { id: 'online',   icone: '💳', titulo: 'Pagar agora (online)',  desc: 'Cartão de crédito, débito ou Pix' },
                  { id: 'dinheiro', icone: '💵', titulo: 'Dinheiro na entrega',   desc: 'Informe se precisa de troco' },
                  { id: 'maquina',  icone: '📱', titulo: 'Máquina na entrega',    desc: 'Crédito ou débito na entrega' },
                ].map(op => (
                  <div key={op.id} className={`pagamento-opcao ${pagamento === op.id ? 'selecionado' : ''}`} onClick={() => setPagamento(op.id)}>
                    <div className="pagamento-radio"><div className="pagamento-radio-inner" /></div>
                    <span className="pagamento-icone">{op.icone}</span>
                    <div className="pagamento-info">
                      <div className="pagamento-titulo">{op.titulo}</div>
                      <div className="pagamento-desc">{op.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              {pagamento === 'dinheiro' && (
                <div className="troco-wrapper">
                  <div className="form-group">
                    <label className="form-label">Troco para quanto?</label>
                    <input className="form-input" placeholder="Ex: R$ 50,00 (deixe vazio se não precisar)"
                      value={troco} onChange={e => setTroco(e.target.value)} />
                  </div>
                </div>
              )}
            </div>

            <div className="checkout-card">
              <div className="checkout-card-titulo"><span>🕐</span> Estimativa de preparo</div>
              <div className="estimativa-box">
                <span className="estimativa-icone">{tipoEntrega === 'retirada' ? '🏪' : '🛵'}</span>
                <div>
                  <div className="estimativa-titulo">{tipoEntrega === 'retirada' ? 'Pronto para retirada em' : 'Entrega estimada em'}</div>
                  <div className="estimativa-tempo">{tempoEstimado}</div>
                  <div className="estimativa-desc">{tipoEntrega === 'retirada' ? 'Você retira no balcão da loja' : 'Após a confirmação do pedido'}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="checkout-card">
            <div className="checkout-card-titulo"><span>🧾</span> Resumo do pedido</div>
            <div className="resumo-itens">
              {itens.map(item => (
                <div key={item.id} className="resumo-item">
                  <div className="resumo-item-info">
                    <div className="resumo-item-nome">{item.quantidade}× {item.nomeProduto}</div>
                    <div className="resumo-item-detalhe">
                      {item.tamanho}{item.sabores?.length > 1 && ` · ${item.sabores.join(', ')}`}
                    </div>
                  </div>
                  <div className="resumo-item-preco">{formatarPreco(item.totalItem)}</div>
                </div>
              ))}
            </div>

            <div className="resumo-divisor" />

            <div className="resumo-linha">
              <span>Subtotal</span><span>{formatarPreco(subtotal)}</span>
            </div>
            {desconto > 0 && (
              <div className="resumo-linha desconto">
                <span>Desconto ({labelCupom()})</span>
                <span>− {formatarPreco(desconto)}</span>
              </div>
            )}
            {freteGratis && (
              <div className="resumo-linha desconto">
                <span>Frete grátis (cupom)</span><span>✓</span>
              </div>
            )}
            <div className="resumo-linha">
              <span>Taxa de entrega</span>
              <span>{taxaEntrega === 0 ? 'Grátis' : formatarPreco(taxaEntrega)}</span>
            </div>
            <div className="resumo-linha total">
              <span>Total</span><span>{formatarPreco(total)}</span>
            </div>

            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f7f7f7', borderRadius: 10, fontSize: '0.8rem', color: '#888', lineHeight: 1.6 }}>
              <strong style={{ color: '#555' }}>📋 Detalhes</strong><br />
              {tipoEntrega === 'entrega'
                ? `🛵 Entrega em ${dados.rua}, ${dados.numero} – ${dados.bairro}`
                : '🏪 Retirada na loja'}<br />
              💳 {pagamento === 'online' ? 'Pagamento online' : pagamento === 'dinheiro' ? `Dinheiro${troco ? ` (troco p/ ${troco})` : ''}` : 'Máquina na entrega'}<br />
              🕐 Estimativa: {tempoEstimado}
            </div>
          </div>
        )}

      </div>

      <div className="checkout-confirmar-wrapper">
        {step < STEPS.length - 1 ? (
          <button className="btn-confirmar-pedido" onClick={avancar} disabled={!stepValido(step)}>
            Continuar →
          </button>
        ) : (
          <>
            {erroSalvar && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', marginBottom: 8 }}>
                ⚠️ {erroSalvar}
              </div>
            )}
            <button className="btn-confirmar-pedido" onClick={confirmarPedido} disabled={salvando}>
              {salvando ? '⏳ Salvando pedido...' : `✅ Confirmar Pedido · ${formatarPreco(total)}`}
            </button>
          </>
        )}
      </div>

    </div>
  );
}