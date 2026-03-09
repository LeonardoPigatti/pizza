import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './PerfilPizzaria.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function PerfilPizzaria() {
  const { pizzariaId } = useParams();
  const navigate       = useNavigate();

  const [dados, setDados]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso]   = useState(false);
  const [erro, setErro]         = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    fetch(`${API}/pizzarias/${pizzariaId}`)
      .then(r => r.json())
      .then(data => {
        setDados({
          nome:        data.nome        || '',
          descricao:   data.descricao   || '',
          telefone:    data.telefone    || '',
          email:       data.email       || '',
          banner:      data.banner      || '',
          logo:        data.logo        || '',
          endereco: {
            rua:    data.endereco?.rua    || '',
            numero: data.endereco?.numero || '',
            bairro: data.endereco?.bairro || '',
            cidade: data.endereco?.cidade || '',
            estado: data.endereco?.estado || '',
            cep:    data.endereco?.cep    || '',
          },
          horarios: {
            abertura:   data.horarios?.abertura   || '18:00',
            fechamento: data.horarios?.fechamento || '23:00',
          },
        });
      })
      .catch(() => setErro('Erro ao carregar dados da pizzaria'))
      .finally(() => setLoading(false));
  }, [pizzariaId]);

  function handle(e) {
    const { name, value } = e.target;
    if (name.startsWith('endereco.')) {
      const campo = name.split('.')[1];
      setDados(prev => ({ ...prev, endereco: { ...prev.endereco, [campo]: value } }));
    } else if (name.startsWith('horarios.')) {
      const campo = name.split('.')[1];
      setDados(prev => ({ ...prev, horarios: { ...prev.horarios, [campo]: value } }));
    } else {
      setDados(prev => ({ ...prev, [name]: value }));
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

  if (!dados) return null;

  return (
    <div className="perfil-page">

      {/* Header */}
      <div className="perfil-header">
        <button className="perfil-btn-voltar" onClick={() => navigate(-1)}>←</button>
        <div className="perfil-header-info">
          <h1 className="perfil-titulo">Perfil da Pizzaria</h1>
          <p className="perfil-subtitulo">Gerencie as informações do seu estabelecimento</p>
        </div>
        <button className="perfil-btn-salvar" onClick={salvar} disabled={salvando}>
          {salvando ? '⏳ Salvando...' : sucesso ? '✓ Salvo!' : 'Salvar'}
        </button>
      </div>

      {erro && <div className="perfil-erro">⚠️ {erro}</div>}

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
              <textarea name="descricao" value={dados.descricao} onChange={handle} placeholder="Uma breve descrição da sua pizzaria..." rows={3} />
            </div>
            <div className="perfil-campo full">
              <label>URL do banner</label>
              <input name="banner" value={dados.banner} onChange={handle} placeholder="https://..." />
            </div>
            <div className="perfil-campo full">
              <label>URL do logo</label>
              <input name="logo" value={dados.logo} onChange={handle} placeholder="https://..." />
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
              <label>CEP</label>
              <input name="endereco.cep" value={dados.endereco.cep} onChange={handle} placeholder="00000-000" />
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
              <input name="endereco.estado" value={dados.endereco.estado} onChange={handle} placeholder="SP" maxLength={2} />
            </div>
          </div>
        </section>

        {/* Horários */}
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
        </section>

      </div>

      {/* Botão salvar fixo no mobile */}
      <div className="perfil-footer">
        <button className="perfil-btn-salvar-footer" onClick={salvar} disabled={salvando}>
          {salvando ? '⏳ Salvando...' : sucesso ? '✓ Salvo com sucesso!' : '💾 Salvar alterações'}
        </button>
      </div>

    </div>
  );
}