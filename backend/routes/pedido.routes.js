const router = require('express').Router();
const Pedido = require('../models/Pedido.model');

const STATUS_ORDEM = ['Aguardando confirmacao', 'Preparando', 'Saiu para entrega', 'Concluido'];

function gerarCodigoSeguranca() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O, 0, I, 1 pra evitar confusão
  let codigo = '';
  for (let i = 0; i < 6; i++) codigo += chars[Math.floor(Math.random() * chars.length)];
  return codigo;
}

// GET /api/pedidos
router.get('/', async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('pizzas.produtoId').sort({ createdAt: -1 });
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/pedidos/:id
router.get('/:id', async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id).populate('pizzas.produtoId');
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/pedidos
router.post('/', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '';
    const codigoSeguranca = gerarCodigoSeguranca();
    const pedido = await Pedido.create({ ...req.body, ipCliente: ip, codigoSeguranca });
    res.status(201).json(pedido);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// PATCH /api/pedidos/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { statusPedido, motivo } = req.body;
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });

    const statusAtual  = pedido.statusPedido;
    const idxAtual     = STATUS_ORDEM.indexOf(statusAtual);
    const idxNovo      = STATUS_ORDEM.indexOf(statusPedido);
    const ehRetrocesso = idxNovo < idxAtual;

    if (ehRetrocesso && !motivo?.trim())
      return res.status(400).json({ erro: 'Motivo obrigatório para retornar o status' });

    const update = { statusPedido };
    if (ehRetrocesso) {
      update.$push = {
        historicoStatus: {
          de: statusAtual, para: statusPedido,
          motivo: motivo.trim(), criadoEm: new Date(),
        }
      };
    }

    const atualizado = await Pedido.findByIdAndUpdate(
      req.params.id, update, { new: true, runValidators: false }
    ).populate('pizzas.produtoId');

    res.json(atualizado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// PATCH /api/pedidos/:id/pegar
router.patch('/:id/pegar', async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id, { motoboyPegou: true }, { new: true, runValidators: false }
    ).populate('pizzas.produtoId');
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;