const router = require('express').Router();
const Pedido = require('../models/Pedido.model');

// GET /api/pedidos
router.get('/', async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('pizzas.produtoId');
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
    const { statusPedido } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { statusPedido },
      { new: true, runValidators: true }
    );
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    res.json(pedido);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

module.exports = router;