require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { conectarBanco } = require('./config/database');

const produtoRoutes  = require('./routes/produto.routes');
const pedidoRoutes   = require('./routes/pedido.routes');
const pizzariaRoutes = require('./routes/pizzaria.routes');
const authRoutes     = require('./routes/auth.routes');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Rotas
app.use('/api/auth',      authRoutes);
app.use('/api/produtos',  produtoRoutes);
app.use('/api/pedidos',   pedidoRoutes);
app.use('/api/pizzarias', pizzariaRoutes);

app.get('/', (req, res) => res.json({ status: 'API Pizzaria rodando 🍕' }));

const PORT = process.env.PORT || 3001;

conectarBanco().then(() => {
  app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
});