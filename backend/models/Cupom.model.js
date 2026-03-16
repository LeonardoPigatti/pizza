const mongoose = require('mongoose');

const CupomSchema = new mongoose.Schema({
  pizzariaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pizzaria', required: true },
  codigo:     { type: String, required: true, uppercase: true, trim: true },
  tipo:       { type: String, enum: ['percentual', 'fixo', 'frete_gratis'], required: true },
  valor:      { type: Number, default: 0 },
  ativo:      { type: Boolean, default: true },
  acumulavel: { type: Boolean, default: false },
}, { timestamps: true });

CupomSchema.index({ pizzariaId: 1, codigo: 1 }, { unique: true });

module.exports = mongoose.model('Cupom', CupomSchema);