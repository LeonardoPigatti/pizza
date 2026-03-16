const router   = require('express').Router();
const Pedido   = require('../models/Pedido.model');
const Pizzaria = require('../models/Pizzaria.model');
const mongoose = require('mongoose');

// POST /api/avaliacoes/:pedidoId
router.post('/:pedidoId', async (req, res) => {
  try {
    const { nota, pizzariaId } = req.body;

    if (!nota || nota < 1 || nota > 5)
      return res.status(400).json({ erro: 'Nota deve ser entre 1 e 5' });

    if (!mongoose.Types.ObjectId.isValid(req.params.pedidoId))
      return res.status(400).json({ erro: 'ID inválido' });

    const pedido = await Pedido.findById(req.params.pedidoId);
    if (!pedido) return res.status(404).json({ erro: 'Pedido não encontrado' });
    if (pedido.statusPedido !== 'Concluido')
      return res.status(400).json({ erro: 'Pedido ainda não foi concluído' });
    if (pedido.avaliacao !== null && pedido.avaliacao !== undefined)
      return res.status(400).json({ erro: 'Pedido já foi avaliado' });

    // Salva nota no pedido
    pedido.avaliacao = nota;
    await pedido.save();

    // Atualiza média na pizzaria
    const pizzaria = await Pizzaria.findById(pizzariaId);
    if (pizzaria) {
      const novoTotal = (pizzaria.avaliacaoTotal || 0) + nota;
      const novoCount = (pizzaria.avaliacaoCount || 0) + 1;
      const novaMedia = novoTotal / novoCount;

      await Pizzaria.findByIdAndUpdate(pizzariaId, {
        avaliacaoTotal: novoTotal,
        avaliacaoCount: novoCount,
        avaliacaoMedia: Math.round(novaMedia * 10) / 10,
      });
    }

    res.json({ ok: true, nota });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;