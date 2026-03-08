const mongoose = require('mongoose');

const EnderecoSchema = new mongoose.Schema({
  rua:         { type: String, required: true },
  numero:      { type: String, required: true },
  complemento: { type: String },
  bairro:      { type: String, required: true },
  cidade:      { type: String, required: true },
  estado:      { type: String, required: true },
  cep:         { type: String, required: true },
}, { _id: false });

const PizzariaSchema = new mongoose.Schema({
  nome:     { type: String, required: true },
  endereco: { type: EnderecoSchema, required: true },
  telefone: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Pizzaria', PizzariaSchema);