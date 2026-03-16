import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FAQ.css';

const FAQS = [
  {
    categoria: '🛵 Pedidos e Entrega',
    itens: [
      {
        pergunta: 'Qual é o prazo de entrega?',
        resposta: 'O tempo médio de entrega é de 35 a 50 minutos após a confirmação do pedido. Em horários de pico (sextas, sábados e domingos à noite) pode haver uma pequena variação. Você pode acompanhar o status em tempo real pela tela de acompanhamento do pedido.',
      },
      {
        pergunta: 'Qual é a área de entrega?',
        resposta: 'Atendemos os bairros próximos à nossa localização. Para saber se entregamos no seu endereço, basta iniciar um pedido e informar seu CEP — o sistema indica automaticamente se a entrega está disponível.',
      },
      {
        pergunta: 'Posso retirar meu pedido na loja?',
        resposta: 'Sim! Na hora de finalizar o pedido, escolha a opção "Retirada". Assim você não paga taxa de entrega e o pedido fica pronto mais rápido — geralmente em 20 a 25 minutos.',
      },
      {
        pergunta: 'É possível agendar um pedido para uma hora específica?',
        resposta: 'No momento trabalhamos apenas com pedidos imediatos, sem agendamento. Assim que a loja abrir, seus pedidos são processados em ordem de chegada.',
      },
    ],
  },
  {
    categoria: '💳 Pagamento',
    itens: [
      {
        pergunta: 'Quais formas de pagamento são aceitas?',
        resposta: 'Aceitamos pagamento online (cartão de crédito, débito e Pix) diretamente pelo app, além de dinheiro e maquininha de cartão na entrega ou retirada.',
      },
      {
        pergunta: 'Como funciona o pagamento por Pix?',
        resposta: 'Ao escolher Pix, um QR Code é gerado para você pagar pelo app do seu banco. O pedido é confirmado automaticamente assim que o pagamento é identificado. Não é necessário ter conta em nenhuma plataforma específica.',
      },
      {
        pergunta: 'Posso pagar com vale-refeição ou vale-alimentação?',
        resposta: 'Aceitamos vale-refeição e vale-alimentação apenas no pagamento pela maquininha, na entrega ou na retirada. Por enquanto não é possível utilizar esses cartões pelo app.',
      },
      {
        pergunta: 'Preciso de troco? Como informo?',
        resposta: 'Sim! Se for pagar em dinheiro, durante o checkout há um campo específico para informar o valor que você vai usar. Assim nosso entregador já vem preparado com o troco certo.',
      },
    ],
  },
  {
    categoria: '🍕 Produtos',
    itens: [
      {
        pergunta: 'Posso escolher mais de um sabor na pizza?',
        resposta: 'Sim! Dependendo do tamanho escolhido, você pode combinar até 2 sabores. O valor cobrado é sempre o do sabor mais caro entre os selecionados, e isso fica claro na tela antes de confirmar.',
      },
      {
        pergunta: 'As pizzas são feitas na hora?',
        resposta: 'Sim, todas as nossas pizzas são preparadas na hora do pedido com massa artesanal e ingredientes frescos. Por isso o tempo de preparo pode variar um pouco em dias de maior movimento.',
      },
      {
        pergunta: 'Vocês têm opções veganas ou vegetarianas?',
        resposta: 'Sim! Nosso cardápio conta com pizzas e produtos marcados como veganos e vegetarianos. Use o filtro de categorias no cardápio para encontrá-los facilmente.',
      },
      {
        pergunta: 'Posso fazer alguma observação no meu pedido?',
        resposta: 'Claro! Em cada produto há um campo de observações onde você pode informar preferências como "sem cebola", "ponto da massa" ou qualquer outro detalhe. Faremos o possível para atender.',
      },
    ],
  },
  {
    categoria: '🔄 Cancelamento e Problemas',
    itens: [
      {
        pergunta: 'Posso cancelar meu pedido?',
        resposta: 'O cancelamento pelo cliente está disponível caso o pedido esteja com atraso superior ao tempo estimado original. Para pedidos pagos online, o cancelamento deve ser solicitado diretamente pelo chat com a pizzaria dentro do app.',
      },
      {
        pergunta: 'E se meu pedido chegar errado ou incompleto?',
        resposta: 'Lamentamos muito! Fale imediatamente com a pizzaria pelo chat disponível na tela de acompanhamento do pedido. Nossa equipe vai resolver da melhor forma possível, seja enviando o item faltante ou aplicando um crédito no próximo pedido.',
      },
      {
        pergunta: 'Como entro em contato com a pizzaria?',
        resposta: 'Você pode usar o chat em tempo real disponível na tela de acompanhamento do seu pedido. Também é possível ligar diretamente pelo número exibido na página do cardápio.',
      },
    ],
  },
];

export default function FAQ() {
  const navigate          = useNavigate();
  const { pizzariaId }    = useParams();
  const [aberto, setAberto] = useState(null);
  const [busca, setBusca]   = useState('');

  const toggle = (key) => setAberto(prev => prev === key ? null : key);

  const faqsFiltrados = busca.trim()
    ? FAQS.map(cat => ({
        ...cat,
        itens: cat.itens.filter(
          item =>
            item.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
            item.resposta.toLowerCase().includes(busca.toLowerCase())
        ),
      })).filter(cat => cat.itens.length > 0)
    : FAQS;

  return (
    <div className="faq-page">
      <div className="faq-header">
        <button className="faq-btn-voltar" onClick={() => navigate(`/${pizzariaId}`)}>←</button>
        <div>
          <div className="faq-titulo">❓ Dúvidas frequentes</div>
          <div className="faq-subtitulo">Respostas para as perguntas mais comuns</div>
        </div>
      </div>

      <div className="faq-layout">
        <div className="faq-busca-wrapper">
          <span className="faq-busca-icon">🔍</span>
          <input
            className="faq-busca-input"
            type="text"
            placeholder="Buscar uma dúvida..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          {busca && (
            <button className="faq-busca-limpar" onClick={() => setBusca('')}>✕</button>
          )}
        </div>

        {faqsFiltrados.length === 0 && (
          <div className="faq-vazio">
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🤷</div>
            Nenhuma dúvida encontrada para "<strong>{busca}</strong>"
          </div>
        )}

        {faqsFiltrados.map(cat => (
          <div key={cat.categoria} className="faq-categoria">
            <div className="faq-categoria-titulo">{cat.categoria}</div>
            {cat.itens.map((item, i) => {
              const key = `${cat.categoria}-${i}`;
              const estaAberto = aberto === key;
              return (
                <div key={key} className={`faq-item ${estaAberto ? 'aberto' : ''}`}>
                  <button className="faq-pergunta" onClick={() => toggle(key)}>
                    <span>{item.pergunta}</span>
                    <span className={`faq-chevron ${estaAberto ? 'ativo' : ''}`}>›</span>
                  </button>
                  {estaAberto && (
                    <div className="faq-resposta">
                      {item.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        <div className="faq-contato-card">
          <div className="faq-contato-titulo">Não encontrou o que precisava?</div>
          <div className="faq-contato-desc">Fale com a gente pelo chat no seu pedido ou ligue diretamente para a pizzaria.</div>
          <button className="faq-contato-btn" onClick={() => navigate(`/${pizzariaId}`)}>
            🍕 Voltar ao cardápio
          </button>
        </div>
      </div>
    </div>
  );
}