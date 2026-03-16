require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const { conectarBanco } = require('./config/database');

const produtoRoutes   = require('./routes/Produto.routes');
const pedidoRoutes    = require('./routes/pedido.routes');
const pizzariaRoutes  = require('./routes/pizzaria.routes');
const authRoutes      = require('./routes/auth.routes');
const mensagemRoutes       = require('./routes/mensagem.routes');
const cupomRoutes          = require('./routes/cupom.routes');
const avaliacaoRoutes      = require('./routes/avaliacao.routes');
const infoFinanceiraRoutes = require('./routes/infoFinanceira.routes');

const Mensagem  = require('./models/Mensagem.model');
const Pizzaria  = require('./models/Pizzaria.model');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  socket.on('entrar_sala', (pedidoId) => {
    socket.join(pedidoId);
    console.log(socket.id + ' entrou na sala ' + pedidoId);
  });

  socket.on('sair_sala', (pedidoId) => {
    socket.leave(pedidoId);
  });

  // Salva mensagem no banco e emite para a sala
  socket.on('mensagem', async ({ pedidoId, texto, autor, autorLabel }) => {
    try {
      const salva = await Mensagem.create({ pedidoId, autor, autorLabel: autorLabel || autor, perfil: perfil || autor, texto });
      const msg = {
        _id:        salva._id,
        texto:      salva.texto,
        autor:      salva.autor,
        autorLabel: autorLabel || autor,
        perfil:     salva.perfil,
        hora:       salva.createdAt.toISOString(),
      };
      io.to(pedidoId).emit('mensagem', msg);
    } catch (err) {
      console.error('Erro ao salvar mensagem:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/produtos',   produtoRoutes);
app.use('/api/pedidos',    pedidoRoutes);
app.use('/api/pizzarias',  pizzariaRoutes);
app.use('/api/mensagens',  mensagemRoutes);
app.use('/api/cupons',     cupomRoutes);
app.use('/api/avaliacoes', avaliacaoRoutes);
app.use('/api/financeiro', infoFinanceiraRoutes);

app.get('/', (req, res) => res.json({ status: 'API Pizzaria rodando' }));

const PORT = process.env.PORT || 3001;

conectarBanco().then(() => {
  server.listen(PORT, () => console.log('Servidor rodando em http://localhost:' + PORT));

  // ── Cron: abre/fecha loja automaticamente a cada minuto ──
  const DIAS_SEMANA    = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const Pedido         = require('./models/Pedido.model');
  const STATUS_ABERTOS = ['Aguardando confirmacao', 'Preparando', 'Saiu para entrega'];

  setInterval(async () => {
    try {
      const agora     = new Date();
      const diaAtual  = DIAS_SEMANA[agora.getDay()];
      const horaAtual = agora.toTimeString().slice(0, 5); // "HH:MM"

      const pizzarias = await Pizzaria.find({ abrirAutomatico: true });

      for (const p of pizzarias) {
        // Pega horário do dia atual (por dia ou fallback global)
        const hDia        = p.horariosPorDia?.[diaAtual];
        const diaAtivo    = hDia ? hDia.ativo !== false : (p.diasFuncionamento || []).includes(diaAtual);
        const abertura    = hDia?.abertura        || p.horarios?.abertura        || '17:00';
        const fechCardapio= hDia?.fechamento      || p.horarios?.fechamento      || '23:00';
        const fechCaixa   = hDia?.fechamentoCaixa || p.horarios?.fechamentoCaixa || '00:00';

        // Cardápio aberto: dentro do horário de funcionamento
        const cardapioAberto = diaAtivo && horaAtual >= abertura && horaAtual < fechCardapio;

        // Status desejado para o cardápio (aceitar novos pedidos)
        const novoStatus = cardapioAberto ? 'open' : 'closed';

        if (p.status !== novoStatus) {
          if (novoStatus === 'closed') {
            // Verificar se ainda está dentro do horário do caixa
            // (meia-noite ou depois: hora do caixa pode ser <= abertura)
            const dentroDoCaixa = fechCaixa > fechCardapio
              ? horaAtual < fechCaixa
              : true; // passou da meia-noite, considera ainda dentro

            if (dentroDoCaixa) {
              const pedidosAbertos = await Pedido.countDocuments({
                pizzariaId:   p._id,
                statusPedido: { $in: STATUS_ABERTOS },
              });

              if (pedidosAbertos > 0) {
                console.log(`[Auto] "${p.nome}" cardápio fechado mas ${pedidosAbertos} pedido(s) em andamento. Caixa aberto até ${fechCaixa}. Tentando fechar no próximo minuto.`);
                continue;
              }
            }
          }

          await Pizzaria.findByIdAndUpdate(p._id, { status: novoStatus });
          console.log(`[Auto] Pizzaria "${p.nome}" → ${novoStatus} (${diaAtual} ${horaAtual})`);
        }
      }
    } catch (err) {
      console.error('[Auto] Erro no cron de abertura:', err.message);
    }
  }, 60 * 1000); // roda a cada 1 minuto
});