const router  = require('express').Router();
const Produto = require('../models/Produto.model');

// GET /api/produtos?pizzariaId=xxx
router.get('/', async (req, res) => {
  try {
    const filtro = req.query.pizzariaId ? { pizzariaId: req.query.pizzariaId } : {};
    const produtos = await Produto.find(filtro).sort({ createdAt: -1 });
    res.json(produtos);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET /api/produtos/:id
router.get('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(produto);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/produtos
router.post('/', async (req, res) => {
  try {
    const produto = await Produto.create(req.body);
    res.status(201).json(produto);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// PATCH /api/produtos/:id
router.patch('/:id', async (req, res) => {
  try {
    const produto = await Produto.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: false }
    );
    if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
    res.json(produto);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

// DELETE /api/produtos/:id
router.delete('/:id', async (req, res) => {
  try {
    await Produto.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;