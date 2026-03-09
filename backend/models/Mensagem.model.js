const mongoose = require('mongoose');

const MensagemSchema = new mongoose.Schema({
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true, index: true },
  autor:    { type: String, enum: ['cliente', 'pizzaria'], required: true },
  texto:    { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Mensagem', MensagemSchema);