require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const http       = require('http');
const { Server } = require('socket.io');
const { conectarBanco } = require('./config/database');

const produtoRoutes  = require('./routes/produto.routes');
const pedidoRoutes   = require('./routes/pedido.routes');
const pizzariaRoutes = require('./routes/pizzaria.routes');
const authRoutes     = require('./routes/auth.routes');

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] },
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id);

  // Cliente ou pizzaria entra na sala do pedido
  socket.on('entrar_sala', (pedidoId) => {
    socket.join(pedidoId);
    console.log(socket.id + ' entrou na sala ' + pedidoId);
  });

  // Mensagem enviada por qualquer lado
  socket.on('mensagem', ({ pedidoId, texto, autor }) => {
    const mensagem = {
      texto,
      autor, // 'cliente' ou 'pizzaria'
      hora: new Date().toISOString(),
    };
    io.to(pedidoId).emit('mensagem', mensagem);
  });

  socket.on('sair_sala', (pedidoId) => {
    socket.leave(pedidoId);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/produtos',  produtoRoutes);
app.use('/api/pedidos',   pedidoRoutes);
app.use('/api/pizzarias', pizzariaRoutes);

app.get('/', (req, res) => res.json({ status: 'API Pizzaria rodando' }));

const PORT = process.env.PORT || 3001;

conectarBanco().then(() => {
  server.listen(PORT, () => console.log('Servidor rodando em http://localhost:' + PORT));
});