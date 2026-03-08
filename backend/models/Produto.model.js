const mongoose = require('mongoose');

const AdicionalSchema = new mongoose.Schema({
  nome:  { type: String, required: true },
  preco: { type: Number, required: true },
}, { _id: false });

const TamanhoSchema = new mongoose.Schema({
  tamanho:    { type: String, enum: ['Pequena', 'Média', 'Grande'], required: true },
  preco:      { type: Number, required: true },
  maxSabores: { type: Number, required: true },
}, { _id: false });

const ProdutoSchema = new mongoose.Schema({
  nome:       { type: String, required: true },
  descricao:  { type: String, default: '' },
  categorias: { type: [String], default: [] }, // ex: ['Tradicional', 'Vegana']
  tamanhos:   { type: [TamanhoSchema], default: [] },
  adicionais: { type: [AdicionalSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Produto', ProdutoSchema);