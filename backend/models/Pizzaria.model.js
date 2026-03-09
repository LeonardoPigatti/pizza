const mongoose = require('mongoose');

const EnderecoSchema = new mongoose.Schema({
  rua:         { type: String },
  numero:      { type: String },
  complemento: { type: String },
  bairro:      { type: String },
  cidade:      { type: String },
  estado:      { type: String },
  cep:         { type: String },
}, { _id: false });

const HorarioSchema = new mongoose.Schema({
  abertura:   { type: String, default: '18:00' },
  fechamento: { type: String, default: '23:00' },
}, { _id: false });

const PizzariaSchema = new mongoose.Schema({
  nome:      { type: String, required: true },
  descricao: { type: String, default: '' },
  telefone:  { type: String, default: '' },
  email:     { type: String, default: '' },
  banner:    { type: String, default: '' },
  logo:      { type: String, default: '' },
  endereco:  { type: EnderecoSchema, default: () => ({}) },
  horarios:  { type: HorarioSchema,  default: () => ({}) },
  tempoMedioEntrega: { type: Number, default: 40 }, // em minutos
}, { timestamps: true });

module.exports = mongoose.model('Pizzaria', PizzariaSchema);