const mongoose = require('mongoose');

const PizzariaSchema = new mongoose.Schema({
  nome:        { type: String, required: true },
  descricao:   { type: String, default: '' },
  telefone:    { type: String, default: '' },
  email:       { type: String, default: '' },
  banner:      { type: String, default: '' },
  logo:        { type: String, default: '' },
  endereco: {
    rua:         { type: String, default: '' },
    numero:      { type: String, default: '' },
    complemento: { type: String, default: '' },
    bairro:      { type: String, default: '' },
    cidade:      { type: String, default: '' },
    estado:      { type: String, default: '' },
    cep:         { type: String, default: '' },
  },
  horarios: {
    abertura:   { type: String, default: '' },
    fechamento: { type: String, default: '' },
  },
  tempoMedioEntrega: { type: Number, default: 40 },

  // Avaliações
  avaliacaoMedia: { type: Number, default: 0 },
  avaliacaoTotal: { type: Number, default: 0 },
  avaliacaoCount: { type: Number, default: 0 },
  status:       { type: String, enum: ['open', 'closed'], default: 'open' },
  taxaEntrega:        { type: Number, default: 0 },
  diasFuncionamento:  { type: [String], default: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] },
  abrirAutomatico:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Pizzaria', PizzariaSchema);