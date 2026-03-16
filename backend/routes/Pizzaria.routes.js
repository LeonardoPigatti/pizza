const router   = require('express').Router();
const Pizzaria = require('../models/Pizzaria.model');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/pizzarias/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ erro: `ID inválido: "${req.params.id}"` });

    const pizzaria = await Pizzaria.findById(req.params.id);
    if (!pizzaria) return res.status(404).json({ erro: 'Pizzaria não encontrada' });
    res.json(pizzaria);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/pizzarias/:id
router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ erro: `ID inválido: "${req.params.id}"` });

    const pizzaria = await Pizzaria.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: false }
    );
    if (!pizzaria) return res.status(404).json({ erro: 'Pizzaria não encontrada' });
    res.json(pizzaria);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// PATCH /api/pizzarias/:id/status — abre ou fecha a loja
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'open' ou 'closed'
    if (!['open', 'closed'].includes(status))
      return res.status(400).json({ erro: 'Status inválido' });

    const pizzaria = await Pizzaria.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!pizzaria) return res.status(404).json({ erro: 'Pizzaria não encontrada' });
    res.json(pizzaria);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;