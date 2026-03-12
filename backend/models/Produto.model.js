const mongoose = require('mongoose');

const AdicionalSchema = new mongoose.Schema({
  nome:  { type: String, required: true },
  preco: { type: Number, required: true },
}, { _id: false });

const TamanhoSchema = new mongoose.Schema({
  tamanho:    { type: String, required: true },
  preco:      { type: Number, required: true },
  maxSabores: { type: Number, default: 1 },
}, { _id: false });

const ProdutoSchema = new mongoose.Schema({
  pizzariaId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Pizzaria', required: true },
  nome:          { type: String, required: true },
  descricao:     { type: String, default: '' },
  imagem:        { type: String, default: '' },
  categoria:     { type: String, required: true },
  subcategorias: { type: [String], default: [] },
  temSabores:    { type: Boolean, default: false },
  tamanhos:      { type: [TamanhoSchema], default: [] },
  preco:         { type: Number, default: 0 },
  adicionais:    { type: [AdicionalSchema], default: [] },
  outrosSabores: { type: [String], default: [] },
  ativo:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Produto', ProdutoSchema);