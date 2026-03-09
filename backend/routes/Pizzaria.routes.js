const router   = require('express').Router();
const Pizzaria = require('../models/Pizzaria.model');

// GET /api/pizzarias/:id
router.get('/:id', async (req, res) => {
  try {
    const pizzaria = await Pizzaria.findById(req.params.id);
    if (!pizzaria) return res.status(404).json({ erro: 'Pizzaria não encontrada' });
    res.json(pizzaria);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/pizzarias/:id — atualiza perfil
router.patch('/:id', async (req, res) => {
  try {
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

module.exports = router;