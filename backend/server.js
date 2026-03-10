require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const { conectarBanco } = require('./config/database');

const produtoRoutes   = require('./routes/produto.routes');
const pedidoRoutes    = require('./routes/pedido.routes');
const pizzariaRoutes  = require('./routes/Pizzaria.routes');
const authRoutes      = require('./routes/auth.routes');
const mensagemRoutes  = require('./routes/mensagem.routes');


const Mensagem = require('./models/Mensagem.model');

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
  socket.on('mensagem', async ({ pedidoId, texto, autor }) => {
    try {
      const salva = await Mensagem.create({ pedidoId, autor, texto });
      const msg = {
        _id:    salva._id,
        texto:  salva.texto,
        autor:  salva.autor,
        hora:   salva.createdAt.toISOString(),
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
app.use('/api/avaliacoes', require('./routes/avaliacao.routes'));
app.use('/api/financeiro', require('./routes/infoFinanceira.routes'));
app.get('/', (req, res) => res.json({ status: 'API Pizzaria rodando' }));

const PORT = process.env.PORT || 3001;

conectarBanco().then(() => {
  server.listen(PORT, () => console.log('Servidor rodando em http://localhost:' + PORT));
});