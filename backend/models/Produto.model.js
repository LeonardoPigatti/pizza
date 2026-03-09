const mongoose = require('mongoose');

const AdicionalSchema = new mongoose.Schema({
  nome:  { type: String, required: true },
  preco: { type: Number, required: true },
}, { _id: false });

const TamanhoSchema = new mongoose.Schema({
  tamanho:    { type: String, required: true }, // ex: Pequena, Media, Grande, 300ml, 500ml
  preco:      { type: Number, required: true },
  maxSabores: { type: Number, default: 1 },
}, { _id: false });

const ProdutoSchema = new mongoose.Schema({
  pizzariaId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Pizzaria', required: true },
  nome:         { type: String, required: true },
  descricao:    { type: String, default: '' },
  imagem:       { type: String, default: '' },
  categoria:    { type: String, required: true }, // Pizza, Bebida, Hamburguer, Doce...
  subcategorias:{ type: [String], default: [] },  // Vegana, Tradicional, Especial...
  temSabores:   { type: Boolean, default: false }, // true só para pizza
  tamanhos:     { type: [TamanhoSchema], default: [] },
  preco:        { type: Number, default: 0 },      // usado quando tamanho único
  adicionais:   { type: [AdicionalSchema], default: [] },
  ativo:        { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Produto', ProdutoSchema);