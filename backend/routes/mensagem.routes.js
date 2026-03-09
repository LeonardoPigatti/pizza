const router   = require('express').Router();
const Mensagem = require('../models/Mensagem.model');

// GET /api/mensagens/:pedidoId — busca histórico do pedido
router.get('/:pedidoId', async (req, res) => {
  try {
    const mensagens = await Mensagem.find({ pedidoId: req.params.pedidoId })
      .sort({ createdAt: 1 });
    res.json(mensagens);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;