const router         = require('express').Router();
const InfoFinanceira = require('../models/Infofinanceira.model');
const authMiddleware = require('../middleware/auth.middleware');

// GET /api/financeiro?pizzariaId=xxx  — lista histórico
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { pizzariaId } = req.query;
    const registros = await InfoFinanceira
      .find({ pizzariaId })
      .sort({ createdAt: -1 });
    res.json(registros);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// POST /api/financeiro  — salva fechamento do dia
router.post('/', authMiddleware, async (req, res) => {
  try {
    const registro = await InfoFinanceira.create(req.body);
    res.status(201).json(registro);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

module.exports = router;