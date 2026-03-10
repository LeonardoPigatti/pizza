import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PerfilPizzaria.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const VAZIO = {
  nome: '', descricao: '', telefone: '', email: '', banner: '', logo: '',
  endereco: { rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '' },
  horarios:  { abertura: '18:00', fechamento: '23:00' },
  tempoMedioEntrega: 40,
};

export default function PerfilPizzaria() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();

  const [dados, setDados]         = useState(VAZIO);
  const [loading, setLoading]     = useState(true);
  const [salvando, setSalvando]   = useState(false);
  const [sucesso, setSucesso]     = useState(false);
  const [erro, setErro]           = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroCep, setErroCep]     = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API}/pizzarias/${pizzariaId}`)
      .then(r => r.json())
      .then(data => {
        setDados({
          nome:      data.nome      || '',
          descricao: data.descricao || '',
          telefone:  data.telefone  || '',
          email:     data.email     || '',
          banner:    data.banner    || '',
          logo:      data.logo      || '',
          endereco: {
            rua:         data.endereco?.rua         || '',
            numero:      data.endereco?.numero      || '',
            complemento: data.endereco?.complemento || '',
            bairro:      data.endereco?.bairro      || '',
            cidade:      data.endereco?.cidade      || '',
            estado:      data.endereco?.estado      || '',
            cep:         data.endereco?.cep         || '',
          },
          horarios: {
            abertura:   data.horarios?.abertura   || '18:00',
            fechamento: data.horarios?.fechamento || '23:00',
          },
          tempoMedioEntrega: data.tempoMedioEntrega ?? 40,
        });
      })
      .catch(() => setErro('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, [pizzariaId]);

  function handle(e) {
    const { name, value } = e.target;
    if (name.startsWith('endereco.')) {
      const campo = name.split('.')[1];
      setDados(p => ({ ...p, endereco: { ...p.endereco, [campo]: value } }));
    } else if (name.startsWith('horarios.')) {
      const campo = name.split('.')[1];
      setDados(p => ({ ...p, horarios: { ...p.horarios, [campo]: value } }));
    } else {
      setDados(p => ({ ...p, [name]: value }));
    }
  }

  async function handleCep(e) {
    const cep = e.target.value.replace(/\D/g, '');
    setDados(p => ({ ...p, endereco: { ...p.endereco, cep: e.target.value } }));
    setErroCep(null);

    if (cep.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { setErroCep('CEP não encontrado'); return; }
      setDados(p => ({
        ...p,
        endereco: {
          ...p.endereco,
          cep:    e.target.value,
          rua:    data.logradouro || '',
          bairro: data.bairro     || '',
          cidade: data.localidade || '',
          estado: data.uf         || '',
        },
      }));
    } catch {
      setErroCep('Erro ao buscar CEP');
    } finally {
      setBuscandoCep(false);
    }
  }

  async function salvar() {
    setSalvando(true);
    setSucesso(false);
    setErro(null);
    const token = localStorage.getItem('token');
    try {
      const res  = await fetch(`${API}/pizzarias/${pizzariaId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(dados),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao salvar');
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return (
    <div className="perfil-loading">
      <div className="perfil-spinner" />
      <p>Carregando...</p>
    </div>
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

        <section className="perfil-secao">
          <div className="perfil-secao-titulo">📍 Endereço</div>
          <div className="perfil-grid">

            {/* CEP com busca automática */}
            <div className="perfil-campo">
              <label>
                CEP
                {buscandoCep && <span className="perfil-cep-status"> 🔍 Buscando...</span>}
                {erroCep     && <span className="perfil-cep-status erro"> ⚠️ {erroCep}</span>}
              </label>
              <input
                name="endereco.cep"
                value={dados.endereco.cep}
                onChange={handleCep}
                placeholder="00000-000"
                maxLength={9}
              />
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

        <section className="perfil-secao">
          <div className="perfil-secao-titulo">🕐 Horário de funcionamento</div>
          <div className="perfil-grid">
            <div className="perfil-campo">
              <label>Abertura</label>
              <input name="horarios.abertura" type="time" value={dados.horarios.abertura} onChange={handle} />
            </div>
            <div className="perfil-campo">
              <label>Fechamento</label>
              <input name="horarios.fechamento" type="time" value={dados.horarios.fechamento} onChange={handle} />
            </div>
          </div>
          <div className="perfil-grid" style={{ marginTop: 12 }}>
            <div className="perfil-campo">
              <label>Tempo médio de entrega (min)</label>
              <input
                name="tempoMedioEntrega"
                type="number" min="10" max="120"
                value={dados.tempoMedioEntrega}
                onChange={e => setDados(p => ({ ...p, tempoMedioEntrega: Number(e.target.value) }))}
                placeholder="Ex: 40"
              />
            </div>
            <div className="perfil-campo" style={{ justifyContent: 'flex-end', paddingBottom: 2 }}>
              <span style={{ fontSize: '0.78rem', color: '#aaa', marginTop: 'auto' }}>
                Exibido como "🕐 {dados.tempoMedioEntrega} min" no cardápio
              </span>
            </div>
          </div>
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