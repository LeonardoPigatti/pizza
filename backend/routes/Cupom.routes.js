const router         = require('express').Router();
const Cupom          = require('../models/Cupom.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/cupons?pizzariaId=xxx
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cupons = await Cupom.find({ pizzariaId: req.query.pizzariaId }).sort({ createdAt: -1 });
    res.json(cupons);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/cupons — criar cupom
router.post('/', authMiddleware, async (req, res) => {
  try {
    const cupom = await Cupom.create(req.body);
    res.status(201).json(cupom);
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ erro: 'Já existe um cupom com esse código' });
    res.status(400).json({ erro: err.message });
  }
});

// PATCH /api/cupons/:id/toggle — ativar/desativar
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const cupom = await Cupom.findById(req.params.id);
    if (!cupom) return res.status(404).json({ erro: 'Cupom não encontrado' });
    cupom.ativo = !cupom.ativo;
    await cupom.save();
    res.json(cupom);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/cupons/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Cupom.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/cupons/validar?codigo=xxx&pizzariaId=xxx — usado pelo cliente no checkout
router.get('/validar', async (req, res) => {
  try {
    const { codigo, pizzariaId } = req.query;
    const cupom = await Cupom.findOne({
      pizzariaId,
      codigo: codigo.toUpperCase().trim(),
      ativo: true,
    });
    if (!cupom) return res.status(404).json({ erro: 'Cupom inválido ou inativo' });
    res.json(cupom);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;