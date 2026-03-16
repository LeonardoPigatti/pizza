import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PerfilPizzaria.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const HORARIO_DIA_VAZIO = { ativo: true, abertura: '17:00', fechamento: '23:00', fechamentoCaixa: '00:00' };

function horariosPorDiaVazio() {
  return Object.fromEntries(DIAS.map(d => [d, { ...HORARIO_DIA_VAZIO }]));
}

const VAZIO = {
  nome: '', descricao: '', telefone: '', email: '', banner: '', logo: '',
  endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
  horariosPorDia: horariosPorDiaVazio(),
  abrirAutomatico: false,
  tempoMedioEntrega: 40,
  taxaEntrega: 0,
};

const CUPOM_VAZIO = { codigo: '', tipo: 'percentual', valor: '', acumulavel: false };

function formatarPreco(v) {
  return `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
}

function normalizeHorariosPorDia(raw) {
  const base = horariosPorDiaVazio();
  if (!raw) return base;
  DIAS.forEach(d => {
    if (raw[d]) base[d] = { ...HORARIO_DIA_VAZIO, ...raw[d] };
  });
  return base;
}

export default function PerfilPizzaria() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();

  const [dados, setDados]             = useState(VAZIO);
  const [loading, setLoading]         = useState(true);
  const [salvando, setSalvando]       = useState(false);
  const [sucesso, setSucesso]         = useState(false);
  const [erro, setErro]               = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep]         = useState(null);

  const [cupons, setCupons]               = useState([]);
  const [novoCupom, setNovoCupom]         = useState(CUPOM_VAZIO);
  const [salvandoCupom, setSalvandoCupom] = useState(false);
  const [erroCupom, setErroCupom]         = useState(null);
  const [deletandoCupom, setDeletandoCupom] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    Promise.all([
      fetch(`${API}/pizzarias/${pizzariaId}`).then(r => r.json()),
      fetch(`${API}/cupons?pizzariaId=${pizzariaId}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([pd, cuponsData]) => {
      setDados({
        nome:      pd.nome      || '',
        descricao: pd.descricao || '',
        telefone:  pd.telefone  || '',
        email:     pd.email     || '',
        banner:    pd.banner    || '',
        logo:      pd.logo      || '',
        endereco: {
          rua:         pd.endereco?.rua         || '',
          numero:      pd.endereco?.numero      || '',
          complemento: pd.endereco?.complemento || '',
          bairro:      pd.endereco?.bairro      || '',
          cidade:      pd.endereco?.cidade      || '',
          estado:      pd.endereco?.estado      || '',
          cep:         pd.endereco?.cep         || '',
        },
        horariosPorDia:    normalizeHorariosPorDia(pd.horariosPorDia),
        tempoMedioEntrega: pd.tempoMedioEntrega ?? 40,
        taxaEntrega:       pd.taxaEntrega       ?? 0,
        abrirAutomatico:   pd.abrirAutomatico   ?? false,
      });
      if (Array.isArray(cuponsData)) setCupons(cuponsData);
    })
    .catch(() => setErro('Erro ao carregar dados'))
    .finally(() => setLoading(false));
  }, [pizzariaId]);

  function handle(e) {
    const { name, value } = e.target;
    if (name.startsWith('endereco.')) {
      const campo = name.split('.')[1];
      setDados(p => ({ ...p, endereco: { ...p.endereco, [campo]: value } }));
    } else {
      setDados(p => ({ ...p, [name]: value }));
    }
  }

  function handleHorarioDia(dia, campo, valor) {
    setDados(p => ({
      ...p,
      horariosPorDia: {
        ...p.horariosPorDia,
        [dia]: { ...p.horariosPorDia[dia], [campo]: valor },
      },
    }));
  }

  // Aplicar mesmo horário para todos os dias ativos
  function aplicarParaTodos(diaOrigem) {
    const h = dados.horariosPorDia[diaOrigem];
    setDados(p => {
      const novo = { ...p.horariosPorDia };
      DIAS.forEach(d => {
        if (novo[d].ativo) novo[d] = { ...novo[d], abertura: h.abertura, fechamento: h.fechamento, fechamentoCaixa: h.fechamentoCaixa };
      });
      return { ...p, horariosPorDia: novo };
    });
  }

  async function handleCep(e) {
    const raw = e.target.value;
    const cep = raw.replace(/\D/g, '');
    setDados(p => ({ ...p, endereco: { ...p.endereco, cep: raw } }));
    setErroCep(null);
    if (cep.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { setErroCep('CEP não encontrado'); return; }
      setDados(p => ({
        ...p,
        endereco: { ...p.endereco, cep: raw, rua: data.logradouro || '', bairro: data.bairro || '', cidade: data.localidade || '', estado: data.uf || '' },
      }));
    } catch { setErroCep('Erro ao buscar CEP'); }
    finally   { setBuscandoCep(false); }
  }

  async function salvar() {
    setSalvando(true); setSucesso(false); setErro(null);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/pizzarias/${pizzariaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:   JSON.stringify(dados),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao salvar');
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) { setErro(err.message); }
    finally       { setSalvando(false); }
  }

  async function criarCupom() {
    if (!novoCupom.codigo.trim()) { setErroCupom('Informe o código'); return; }
    if (novoCupom.tipo !== 'frete_gratis' && !novoCupom.valor) { setErroCupom('Informe o valor'); return; }
    setSalvandoCupom(true); setErroCupom(null);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/cupons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:   JSON.stringify({ ...novoCupom, valor: Number(novoCupom.valor) || 0, pizzariaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao criar cupom');
      setCupons(prev => [data, ...prev]);
      setNovoCupom(CUPOM_VAZIO);
    } catch (err) { setErroCupom(err.message); }
    finally       { setSalvandoCupom(false); }
  }

  async function toggleCupom(id) {
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/cupons/${id}/toggle`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro);
      setCupons(prev => prev.map(c => c._id === id ? data : c));
    } catch (err) { alert(err.message); }
  }

  async function deletarCupom(id) {
    setDeletandoCupom(id);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API}/cupons/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setCupons(prev => prev.filter(c => c._id !== id));
    } catch (err) { alert(err.message); }
    finally       { setDeletandoCupom(null); }
  }

  if (loading) return (
    <div className="perfil-loading"><div className="perfil-spinner" /><p>Carregando...</p></div>
  );

  return (
    <div className="perfil-page">

      <div className="perfil-header">
        <button className="perfil-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <div className="perfil-header-info">
          <h1 className="perfil-titulo">Perfil da Pizzaria</h1>
          <p className="perfil-subtitulo">{dados.nome}</p>
        </div>
        <button className="perfil-btn-salvar" onClick={salvar} disabled={salvando}>
          {salvando ? '⏳' : sucesso ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>

      {erro    && <div className="perfil-feedback erro">⚠️ {erro}</div>}
      {sucesso && <div className="perfil-feedback ok">✓ Alterações salvas com sucesso!</div>}

      <div className="perfil-layout">

        {/* Identidade */}
        <section className="perfil-secao">
          <div className="perfil-secao-titulo">🍕 Identidade</div>
          <div className="perfil-grid">
            <div className="perfil-campo full">
              <label>Nome da pizzaria *</label>
              <input name="nome" value={dados.nome} onChange={handle} placeholder="Ex: Pizzaria do João" />
            </div>
            <div className="perfil-campo full">
              <label>Descrição</label>
              <textarea name="descricao" value={dados.descricao} onChange={handle} placeholder="Uma breve descrição..." rows={3} />
            </div>
            <div className="perfil-campo full">
              <label>URL do banner</label>
              <input name="banner" value={dados.banner} onChange={handle} placeholder="https://..." />
              {dados.banner && <img src={dados.banner} alt="preview banner" className="perfil-img-preview" />}
            </div>
            <div className="perfil-campo full">
              <label>URL do logo</label>
              <input name="logo" value={dados.logo} onChange={handle} placeholder="https://..." />
              {dados.logo && <img src={dados.logo} alt="preview logo" className="perfil-img-preview perfil-img-logo" />}
            </div>
          </div>
        </section>

        {/* Contato */}
        <section className="perfil-secao">
          <div className="perfil-secao-titulo">📞 Contato</div>
          <div className="perfil-grid">
            <div className="perfil-campo">
              <label>Telefone / WhatsApp</label>
              <input name="telefone" value={dados.telefone} onChange={handle} placeholder="(00) 00000-0000" />
            </div>
            <div className="perfil-campo">
              <label>E-mail</label>
              <input name="email" type="email" value={dados.email} onChange={handle} placeholder="contato@pizzaria.com" />
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="perfil-secao">
          <div className="perfil-secao-titulo">📍 Endereço</div>
          <div className="perfil-grid">
            <div className="perfil-campo">
              <label>
                CEP
                {buscandoCep && <span className="perfil-cep-status"> 🔍 Buscando...</span>}
                {erroCep     && <span className="perfil-cep-status erro"> ⚠️ {erroCep}</span>}
              </label>
              <input name="endereco.cep" value={dados.endereco.cep} onChange={handleCep} placeholder="00000-000" maxLength={9} />
            </div>
            <div className="perfil-campo">
              <label>Número</label>
              <input name="endereco.numero" value={dados.endereco.numero} onChange={handle} placeholder="123" />
            </div>
            <div className="perfil-campo full">
              <label>Rua</label>
              <input name="endereco.rua" value={dados.endereco.rua} onChange={handle} placeholder="Rua das Pizzas" />
            </div>
            <div className="perfil-campo">
              <label>Bairro</label>
              <input name="endereco.bairro" value={dados.endereco.bairro} onChange={handle} placeholder="Centro" />
            </div>
            <div className="perfil-campo">
              <label>Cidade</label>
              <input name="endereco.cidade" value={dados.endereco.cidade} onChange={handle} placeholder="São Paulo" />
            </div>
            <div className="perfil-campo">
              <label>Estado</label>
              <input name="endereco.estado" value={dados.endereco.estado} onChange={handle} placeholder="SP" maxLength={2} style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="perfil-campo">
              <label>Complemento</label>
              <input name="endereco.complemento" value={dados.endereco.complemento} onChange={handle} placeholder="Apto, sala..." />
            </div>
          </div>
        </section>

        {/* Horários por dia */}
        <section className="perfil-secao">
          <div className="perfil-secao-titulo">🕐 Horários de funcionamento</div>

          <div className="horarios-tabela">
            {/* Cabeçalho */}
            <div className="horarios-header">
              <div className="hd-dia">Dia</div>
              <div className="hd-campo">Abertura cardápio</div>
              <div className="hd-campo">Fechamento cardápio</div>
              <div className="hd-campo">Fechamento caixa</div>
              <div className="hd-acao"></div>
            </div>

            {DIAS.map(dia => {
              const h = dados.horariosPorDia[dia];
              return (
                <div key={dia} className={`horarios-linha ${!h.ativo ? 'inativo' : ''}`}>
                  <div className="hd-dia">
                    <button
                      type="button"
                      className={`dia-toggle-btn ${h.ativo ? 'ativo' : ''}`}
                      onClick={() => handleHorarioDia(dia, 'ativo', !h.ativo)}
                      title={h.ativo ? 'Clique para desativar este dia' : 'Clique para ativar este dia'}
                    >
                      {dia.slice(0, 3)}
                    </button>
                  </div>
                  <div className="hd-campo">
                    <input
                      type="time"
                      value={h.abertura}
                      disabled={!h.ativo}
                      onChange={e => handleHorarioDia(dia, 'abertura', e.target.value)}
                      className="horario-input"
                    />
                  </div>
                  <div className="hd-campo">
                    <input
                      type="time"
                      value={h.fechamento}
                      disabled={!h.ativo}
                      onChange={e => handleHorarioDia(dia, 'fechamento', e.target.value)}
                      className="horario-input"
                    />
                  </div>
                  <div className="hd-campo">
                    <input
                      type="time"
                      value={h.fechamentoCaixa}
                      disabled={!h.ativo}
                      onChange={e => handleHorarioDia(dia, 'fechamentoCaixa', e.target.value)}
                      className="horario-input"
                    />
                  </div>
                  <div className="hd-acao">
                    {h.ativo && (
                      <button
                        type="button"
                        className="btn-copiar-horario"
                        title="Aplicar estes horários para todos os dias ativos"
                        onClick={() => aplicarParaTodos(dia)}
                      >
                        ⬇ todos
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="horarios-legenda">
            <span>Clique no dia para ativar/desativar · </span>
            <span>⬇ todos aplica o horário daquela linha para todos os dias ativos</span>
          </div>

          {/* Abertura automática */}
          <div className="perfil-campo full" style={{ marginTop: 16 }}>
            <label>Abertura automática</label>
            <label className="perfil-toggle-label">
              <input
                type="checkbox"
                className="perfil-toggle-check"
                checked={dados.abrirAutomatico || false}
                onChange={e => setDados(p => ({ ...p, abrirAutomatico: e.target.checked }))}
              />
              <span className="perfil-toggle-texto">
                Abrir e fechar automaticamente conforme os horários configurados acima
              </span>
            </label>
            {dados.abrirAutomatico && (
              <span className="perfil-campo-hint">
                ✅ O sistema vai abrir e fechar a loja automaticamente respeitando o horário de cada dia.
              </span>
            )}
          </div>

          {/* Tempo e taxa */}
          <div className="perfil-grid" style={{ marginTop: 16 }}>
            <div className="perfil-campo">
              <label>Tempo médio de entrega (min)</label>
              <input name="tempoMedioEntrega" type="number" min="10" max="120"
                value={dados.tempoMedioEntrega}
                onChange={e => setDados(p => ({ ...p, tempoMedioEntrega: Number(e.target.value) }))}
                placeholder="Ex: 40" />
            </div>
            <div className="perfil-campo">
              <label>Taxa de entrega (R$)</label>
              <input name="taxaEntrega" type="number" min="0" step="0.50"
                value={dados.taxaEntrega}
                onChange={e => setDados(p => ({ ...p, taxaEntrega: Number(e.target.value) }))}
                placeholder="Ex: 5,00" />
              <span className="perfil-campo-hint">
                {dados.taxaEntrega === 0 ? 'Entrega grátis' : `Cobrado ${formatarPreco(dados.taxaEntrega)} por entrega`}
              </span>
            </div>
          </div>
        </section>

        {/* Cupons */}
        <section className="perfil-secao">
          <div className="perfil-secao-titulo">🎟️ Cupons de desconto</div>
          <div className="cupom-form">
            <div className="cupom-form-row">
              <div className="perfil-campo" style={{ flex: 2 }}>
                <label>Código</label>
                <input
                  value={novoCupom.codigo}
                  onChange={e => setNovoCupom(p => ({ ...p, codigo: e.target.value.toUpperCase() }))}
                  placeholder="Ex: PROMO10"
                  maxLength={20}
                />
              </div>
              <div className="perfil-campo" style={{ flex: 2 }}>
                <label>Tipo</label>
                <select value={novoCupom.tipo} onChange={e => setNovoCupom(p => ({ ...p, tipo: e.target.value, valor: '' }))}>
                  <option value="percentual">Porcentagem (% off)</option>
                  <option value="fixo">Valor fixo (R$ off)</option>
                  <option value="frete_gratis">Frete grátis</option>
                </select>
              </div>
              {novoCupom.tipo !== 'frete_gratis' && (
                <div className="perfil-campo" style={{ flex: 1 }}>
                  <label>{novoCupom.tipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}</label>
                  <input
                    type="number" min="0" step={novoCupom.tipo === 'percentual' ? '1' : '0.50'}
                    value={novoCupom.valor}
                    onChange={e => setNovoCupom(p => ({ ...p, valor: e.target.value }))}
                    placeholder={novoCupom.tipo === 'percentual' ? '10' : '5,00'}
                  />
                </div>
              )}
              <div className="perfil-campo" style={{ justifyContent: 'flex-end' }}>
                <button className="cupom-btn-criar" onClick={criarCupom} disabled={salvandoCupom}>
                  {salvandoCupom ? '⏳' : '+ Criar'}
                </button>
              </div>
            </div>
            <label className="cupom-acumulavel-label">
              <input
                type="checkbox"
                checked={novoCupom.acumulavel}
                onChange={e => setNovoCupom(p => ({ ...p, acumulavel: e.target.checked }))}
              />
              <span>
                Permitir acumular com outros cupons
                <span className="cupom-acumulavel-hint">
                  {novoCupom.acumulavel
                    ? ' — o cliente poderá usar este junto com outros cupons acumuláveis'
                    : ' — este cupom não poderá ser combinado com outros'}
                </span>
              </span>
            </label>
            {erroCupom && <div className="cupom-erro">⚠️ {erroCupom}</div>}
          </div>

          {cupons.length === 0 ? (
            <p className="perfil-campo-hint" style={{ marginTop: 8 }}>Nenhum cupom cadastrado ainda.</p>
          ) : (
            <div className="cupons-lista">
              {cupons.map(c => (
                <div key={c._id} className={`cupom-item ${c.ativo ? 'ativo' : 'inativo'}`}>
                  <div className="cupom-item-codigo">{c.codigo}</div>
                  <div className="cupom-item-desc">
                    {c.tipo === 'frete_gratis' ? 'Frete grátis' :
                     c.tipo === 'percentual'   ? `${c.valor}% off` :
                                                 `${formatarPreco(c.valor)} off`}
                    {c.acumulavel && (
                      <span className="cupom-badge-acumulavel" title="Pode ser acumulado com outros cupons">
                        🔗 acumulável
                      </span>
                    )}
                  </div>
                  <div className="cupom-item-acoes">
                    <button className={`cupom-toggle ${c.ativo ? 'desativar' : 'ativar'}`} onClick={() => toggleCupom(c._id)}>
                      {c.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button className="cupom-deletar" onClick={() => deletarCupom(c._id)} disabled={deletandoCupom === c._id}>
                      {deletandoCupom === c._id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      <div className="perfil-footer">
        <button className="perfil-btn-salvar-footer" onClick={salvar} disabled={salvando}>
          {salvando ? '⏳ Salvando...' : sucesso ? '✓ Salvo!' : '💾 Salvar alterações'}
        </button>
      </div>

    </div>
  );
}