const router = require('express').Router();
const Pedido = require('../models/Pedido.model');

const STATUS_ORDEM = ['Aguardando confirmacao', 'Preparando', 'Saiu para entrega', 'Concluido'];

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
    const pedido = await Pedido.create(req.body);
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

    // Se for retrocesso exige motivo
    if (ehRetrocesso && !motivo?.trim()) {
      return res.status(400).json({ erro: 'Motivo obrigatório para retornar o status' });
    }

    // Monta o update
    const update = { statusPedido };

    // Se for retrocesso, empurra no histórico
    if (ehRetrocesso) {
      update.$push = {
        historicoStatus: {
          de:     statusAtual,
          para:   statusPedido,
          motivo: motivo.trim(),
          criadoEm: new Date(),
        }
      };
    }

    const atualizado = await Pedido.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: false }
    ).populate('pizzas.produtoId');

    res.json(atualizado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

module.exports = router;