const router = require('express').Router();
const Pizzaria = require('../models/Pizzaria.model');
const Produto = require('../models/Produto.model');

// GET /api/pizzarias/:id
router.get('/:id', async (req, res) => {
  try {
    const pizzaria = await Pizzaria.findById(req.params.id);
    if (!pizzaria) return res.status(404).json({ erro: 'Pizzaria não encontrada' });

    const cardapio = await Produto.find();

    res.json({ ...pizzaria.toObject(), cardapio });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;